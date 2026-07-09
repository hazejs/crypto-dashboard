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
  fetchHistory?: typeof fetchCoinHistory;
  staggerMs?: number;
}

export function createBackfill({ db, fetchHistory = fetchCoinHistory, staggerMs = STAGGER_MS }: BackfillDeps): Backfill {
  const inflight = new Map<string, Promise<boolean>>();
  const lastAttempt = new Map<string, number>();
  let stopped = false;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function hasRecentHistory(coinId: string): Promise<boolean> {
    const since = new Date(Date.now() - RECENT_WINDOW_MS);
    return (await db.ticks.countDocuments({ coinId, ts: { $gte: since } })) >= MIN_RECENT_POINTS;
  }

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
