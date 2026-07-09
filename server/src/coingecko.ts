import type { Coin } from '../../shared/types.ts';
import { config } from './config.ts';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY_HEADER = 'x-cg-demo-api-key';
const RETRY_AFTER_HEADER = 'retry-after';
const FETCH_TIMEOUT_MS = 10_000;
const HTTP_TOO_MANY_REQUESTS = 429;
const MARKETS_PARAMS = {
  vs_currency: 'usd',
  order: 'market_cap_desc',
  page: '1',
  price_change_percentage: '24h'
} as const;
const HISTORY_PARAMS = { vs_currency: 'usd', days: '1' } as const;

interface MarketRow {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
}

export class UpstreamError extends Error {
  override name = 'UpstreamError';
  retryAfterMs: number | null;
  constructor(message: string, retryAfterMs: number | null = null) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

function buildUrl(path: string, params: Record<string, string>): URL {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

async function request(url: URL): Promise<unknown> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (config.coingeckoApiKey) headers[API_KEY_HEADER] = config.coingeckoApiKey;

  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (err) {
    const e = err as Error;
    throw new UpstreamError(e.name === 'TimeoutError' ? 'request timed out' : `request failed: ${e.message}`);
  }

  if (res.status === HTTP_TOO_MANY_REQUESTS) {
    const retryAfterSec = Number(res.headers.get(RETRY_AFTER_HEADER));
    throw new UpstreamError(`rate limited (HTTP ${HTTP_TOO_MANY_REQUESTS})`, retryAfterSec > 0 ? retryAfterSec * 1000 : null);
  }
  if (!res.ok) throw new UpstreamError(`unexpected status ${res.status}`);
  return res.json();
}

export async function fetchTopCoins(): Promise<Coin[]> {
  const url = buildUrl('/coins/markets', { ...MARKETS_PARAMS, per_page: String(config.coinCount) });
  const rows = (await request(url)) as MarketRow[];
  if (!Array.isArray(rows) || rows.length === 0) throw new UpstreamError('empty or malformed response');

  return rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    name: r.name,
    image: r.image,
    rank: r.market_cap_rank,
    price: r.current_price,
    change24h: r.price_change_percentage_24h,
    marketCap: r.market_cap
  }));
}

export async function fetchCoinHistory(coinId: string): Promise<{ ts: Date; price: number }[]> {
  const url = buildUrl(`/coins/${encodeURIComponent(coinId)}/market_chart`, HISTORY_PARAMS);
  const data = (await request(url)) as { prices?: [number, number][] };
  if (!Array.isArray(data.prices)) throw new UpstreamError('malformed history response');
  return data.prices.map(([ms, price]) => ({ ts: new Date(ms), price }));
}
