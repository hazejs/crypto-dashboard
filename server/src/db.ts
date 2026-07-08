import { MongoClient, type Collection } from 'mongodb';
import type { Coin } from '../../shared/types.ts';
import { config } from './config.ts';

const COINS_COLLECTION = 'coins';
const TICKS_COLLECTION = 'ticks';
const TTL_INDEX_KEY = { ts: 1 } as const;
const TTL_INDEX_NAME = 'ts_1';
const SERVER_SELECTION_TIMEOUT_MS = 3000;
const CONNECT_ATTEMPTS = 10;
const CONNECT_RETRY_DELAY_MS = 2000;

// Two collections, deliberately:
//  - coins: one doc per coin, replaced on every successful fetch — the
//    last-known-good snapshot. Survives restarts, so the app serves data
//    immediately even if upstream is down at boot.
//  - ticks: append-only time series powering the history view; a TTL index
//    caps retention so it never needs manual cleanup.
export interface CoinDoc extends Coin {
  _id: string;
  updatedAt: Date;
}

export interface TickDoc {
  coinId: string;
  ts: Date;
  price: number;
}

export interface Db {
  client: MongoClient;
  coins: Collection<CoinDoc>;
  ticks: Collection<TickDoc>;
}

export async function connectDb(): Promise<Db> {
  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });

  // Retry so `docker compose up` works even when Mongo accepts connections late.
  for (let attempt = 1; ; attempt++) {
    try {
      await client.connect();
      break;
    } catch (err) {
      if (attempt >= CONNECT_ATTEMPTS) throw err;
      console.warn(`mongo connect attempt ${attempt}/${CONNECT_ATTEMPTS} failed: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, CONNECT_RETRY_DELAY_MS));
    }
  }

  const db = client.db();
  const coins = db.collection<CoinDoc>(COINS_COLLECTION);
  const ticks = db.collection<TickDoc>(TICKS_COLLECTION);
  await coins.createIndex({ rank: 1 });
  await ticks.createIndex({ coinId: 1, ts: -1 });
  // Recreate the TTL index if HISTORY_TTL_SECONDS changed since it was built —
  // Mongo rejects createIndex with different options (IndexOptionsConflict).
  try {
    await ticks.createIndex(TTL_INDEX_KEY, { expireAfterSeconds: config.historyTtlSeconds });
  } catch (err) {
    if ((err as { codeName?: string }).codeName !== 'IndexOptionsConflict') throw err;
    await ticks.dropIndex(TTL_INDEX_NAME);
    await ticks.createIndex(TTL_INDEX_KEY, { expireAfterSeconds: config.historyTtlSeconds });
  }

  return { client, coins, ticks };
}
