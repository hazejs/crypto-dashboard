import type { Coin, Snapshot, UpstreamStatus } from '../../shared/types.ts';
import { fetchTopCoins, UpstreamError } from './coingecko.ts';
import { config } from './config.ts';
import type { Db } from './db.ts';

const MAX_BACKOFF_MS = 5 * 60_000;
const BACKOFF_EXPONENT_CAP = 4;

export interface Poller {
  snapshot(): Snapshot;
  start(): Promise<void>;
  stop(): void;
}

interface PollerDeps {
  db: Db;
  onUpdate: (snapshot: Snapshot) => void;
  fetchCoins?: () => Promise<Coin[]>; // injectable for tests
}

interface State {
  coins: Coin[];
  lastFetchAt: Date | null;
  upstream: UpstreamStatus;
}

function buildSnapshot({ coins, lastFetchAt, upstream }: State): Snapshot {
  const ageMs = lastFetchAt ? Date.now() - lastFetchAt.getTime() : null;
  return {
    coins,
    lastFetchAt: lastFetchAt?.toISOString() ?? null,
    stale: ageMs === null || ageMs > config.staleAfterMs,
    staleAfterMs: config.staleAfterMs,
    upstream: { ...upstream }
  };
}

// Replace the last-known-good docs and append history ticks. Coins that fell
// out of the top list are pruned so stale ranks never resurface on boot.
async function persist(db: Db, fresh: Coin[], fetchedAt: Date) {
  await db.coins.bulkWrite([
    ...fresh.map((c) => ({
      replaceOne: { filter: { _id: c.id }, replacement: { ...c, updatedAt: fetchedAt }, upsert: true }
    })),
    { deleteMany: { filter: { _id: { $nin: fresh.map((c) => c.id) } } } }
  ]);
  await db.ticks.insertMany(
    fresh.map((c) => ({ coinId: c.id, ts: fetchedAt, price: c.price, change24h: c.change24h, marketCap: c.marketCap }))
  );
}

async function loadLastKnownGood(db: Db, state: State) {
  const docs = await db.coins.find({}).sort({ rank: 1 }).toArray();
  if (docs.length === 0) return;
  state.lastFetchAt = docs.reduce((max, d) => (d.updatedAt > max ? d.updatedAt : max), docs[0].updatedAt);
  state.coins = docs.map(({ _id, updatedAt, ...coin }) => coin);
  console.log(`serving last-known-good data for ${state.coins.length} coins (fetched ${state.lastFetchAt.toISOString()})`);
}

// The single shared refresh loop. Every user is served from the state this loop
// maintains — user requests never trigger upstream calls, so upstream load is a
// constant 1 call per interval regardless of how many clients are connected.
export function createPoller({ db, onUpdate, fetchCoins = fetchTopCoins }: PollerDeps): Poller {
  const state: State = { coins: [], lastFetchAt: null, upstream: { ok: false, consecutiveFailures: 0, lastError: null } };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  async function tick() {
    let delay = config.pollIntervalMs;
    try {
      const fetchedAt = new Date();
      const fresh = await fetchCoins();
      await persist(db, fresh, fetchedAt);
      Object.assign(state, { coins: fresh, lastFetchAt: fetchedAt });
      state.upstream = { ok: true, consecutiveFailures: 0, lastError: null };
    } catch (err) {
      const failures = state.upstream.consecutiveFailures + 1;
      state.upstream = { ok: false, consecutiveFailures: failures, lastError: (err as Error).message };
      // Back off exponentially so we don't hammer a struggling API, and honor
      // Retry-After when rate limited.
      delay = Math.min(config.pollIntervalMs * 2 ** Math.min(failures, BACKOFF_EXPONENT_CAP), MAX_BACKOFF_MS);
      if (err instanceof UpstreamError && err.retryAfterMs) delay = Math.max(delay, err.retryAfterMs);
      console.warn(`upstream fetch failed (${failures} in a row): ${(err as Error).message}; retrying in ${Math.round(delay / 1000)}s`);
    }
    onUpdate(buildSnapshot(state));
    if (!stopped) timer = setTimeout(tick, delay);
  }

  return {
    snapshot: () => buildSnapshot(state),
    async start() {
      await loadLastKnownGood(db, state);
      await tick();
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
    }
  };
}
