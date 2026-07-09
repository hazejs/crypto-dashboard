import type { SNAPSHOT_MESSAGE_TYPE } from './constants.ts';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number;
  price: number;
  change24h: number | null;
  marketCap: number;
}

export interface UpstreamStatus {
  ok: boolean;
  consecutiveFailures: number;
  lastError: string | null;
}

export interface Snapshot {
  coins: Coin[];
  lastFetchAt: string | null;
  stale: boolean;
  staleAfterMs: number;
  upstream: UpstreamStatus;
}

export type SnapshotMessage = Snapshot & { type: typeof SNAPSHOT_MESSAGE_TYPE };

export interface HistoryPoint {
  ts: string;
  price: number;
}

export interface HistoryResponse {
  coinId: string;
  minutes: number;
  points: HistoryPoint[];
}
