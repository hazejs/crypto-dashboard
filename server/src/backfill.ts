import type { Coin } from '../../shared/types.ts';
import { fetchCoinHistory } from './coingecko.ts';
import type { Db } from './db.ts';

const MIN_RECENT_POINTS = 5;
const RECENT_WINDOW_MS = 60 * 60_000;
const STAGGER_MS = 10_000;
const RETRY_COOLDOWN_MS = 60_000;

export interface Backfill {
  run(coins: Coin[]): Promise<void>;
  ensure(coinId: string): Promise<boolean>;
  stop(): void;
}

interface BackfillDeps {
  db: Db;
  fetchHistory?: typeof fetchCoinHistory; // injectable for tests
  staggerMs?: number;
}

// Seeds history for coins that have (almost) no recent ticks: proactively for
// the whole list right after the first poll (staggered, top ranks first), and
// lazily from the history route so the very first click always gets a chart,
// even on a cold database. The frontend still only reads from our database.
export function createBackfill({ db, fetchHistory = fetchCoinHistory, staggerMs = STAGGER_MS }: BackfillDeps): Backfill {
  const inflight = new Map<string, Promise<boolean>>();
  const lastAttempt = new Map<string, number>();
  let stopped = false;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function hasRecentHistory(coinId: string): Promise<boolean> {
    const since = new Date(Date.now() - RECENT_WINDOW_MS);
    return (await db.ticks.countDocuments({ coinId, ts: { $gte: since } })) >= MIN_RECENT_POINTS;
  }

  // Always resolves (never throws); returns true because an upstream call was
  // made — failures are logged and retried after the cooldown.
  async function fill(coinId: string): Promise<boolean> {
    lastAttempt.set(coinId, Date.now());
    try {
      const points = await fetchHistory(coinId);
      if (points.length > 0) {
        await db.ticks.insertMany(points.map((p) => ({ coinId, ts: p.ts, price: p.price })));
      }
      console.log(`backfilled ${points.length} history points for ${coinId}`);
    } catch (err) {
      console.warn(`history backfill failed for ${coinId}: ${(err as Error).message}`);
    }
    return true;
  }

  // Backfill the coin unless it already has recent history, an attempt is
  // already running (concurrent requests share it), or one failed very
  // recently. Returns whether an upstream call was made — run() paces on it.
  async function ensure(coinId: string): Promise<boolean> {
    const running = inflight.get(coinId);
    if (running) {
      await running;
      return false;
    }
    const attempt = (async () => {
      if (await hasRecentHistory(coinId)) return false;
      if (Date.now() - (lastAttempt.get(coinId) ?? 0) < RETRY_COOLDOWN_MS) return false;
      return fill(coinId);
    })();
    inflight.set(coinId, attempt);
    try {
      return await attempt;
    } finally {
      inflight.delete(coinId);
    }
  }

  return {
    ensure,
    async run(coins) {
      for (const coin of coins) {
        if (stopped) return;
        if (await ensure(coin.id)) await sleep(staggerMs);
      }
    },
    stop() {
      stopped = true;
    }
  };
}
