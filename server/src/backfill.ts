import type { Coin } from '../../shared/types.ts';
import { fetchCoinHistory } from './coingecko.ts';
import type { Db } from './db.ts';

const MIN_RECENT_POINTS = 5;
const RECENT_WINDOW_MS = 60 * 60_000;
const STAGGER_MS = 10_000;

export interface Backfill {
  run(coins: Coin[]): Promise<void>;
  stop(): void;
}

interface BackfillDeps {
  db: Db;
  fetchHistory?: typeof fetchCoinHistory; // injectable for tests
  staggerMs?: number;
}

// Seeds the history chart on a cold database: one staggered market_chart call
// per coin that has (almost) no recent ticks, top-ranked coins first. Warm
// restarts skip it entirely, and the frontend keeps reading history only from
// our database — this is the poller's sibling, not a per-request fetch.
export function createBackfill({ db, fetchHistory = fetchCoinHistory, staggerMs = STAGGER_MS }: BackfillDeps): Backfill {
  let stopped = false;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function run(coins: Coin[]) {
    for (const coin of coins) {
      if (stopped) return;
      const since = new Date(Date.now() - RECENT_WINDOW_MS);
      const recent = await db.ticks.countDocuments({ coinId: coin.id, ts: { $gte: since } });
      if (recent >= MIN_RECENT_POINTS) continue;

      try {
        const points = await fetchHistory(coin.id);
        if (points.length > 0) {
          await db.ticks.insertMany(points.map((p) => ({ coinId: coin.id, ts: p.ts, price: p.price })));
        }
        console.log(`backfilled ${points.length} history points for ${coin.id}`);
      } catch (err) {
        console.warn(`history backfill failed for ${coin.id}: ${(err as Error).message}`);
      }
      await sleep(staggerMs);
    }
  }

  return {
    run,
    stop() {
      stopped = true;
    }
  };
}
