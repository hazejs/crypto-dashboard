import type { Coin, Snapshot } from '../../shared/types';

export const makeCoin = (over: Partial<Coin> = {}): Coin => ({
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'btc.png',
  rank: 1,
  price: 62000,
  change24h: 1.23,
  marketCap: 1_230_000_000_000,
  ...over
});

export const makeSnapshot = (over: Partial<Snapshot> = {}): Snapshot => ({
  coins: [makeCoin()],
  lastFetchAt: new Date().toISOString(),
  stale: false,
  staleAfterMs: 90_000,
  upstream: { ok: true, consecutiveFailures: 0, lastError: null },
  ...over
});
