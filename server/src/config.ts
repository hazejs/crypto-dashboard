const num = (v: string | undefined, fallback: number) => Number(v) || fallback;

export const config = {
  port: num(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_dashboard',
  pollIntervalMs: num(process.env.POLL_INTERVAL_MS, 30_000),
  staleAfterMs: num(process.env.STALE_AFTER_MS, 90_000),
  coinCount: num(process.env.COIN_COUNT, 20),
  historyTtlSeconds: num(process.env.HISTORY_TTL_SECONDS, 86_400),
  coingeckoApiKey: process.env.COINGECKO_API_KEY || ''
};
