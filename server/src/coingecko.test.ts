import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { fetchCoinHistory, fetchTopCoins, UpstreamError } from './coingecko.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const stubFetch = (res: object) => {
  globalThis.fetch = (async () => res) as typeof fetch;
};

const row = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'x.png',
  market_cap_rank: 1,
  current_price: 62000,
  price_change_percentage_24h: 1.2,
  market_cap: 1e12
};

test('maps upstream rows to the wire shape', async () => {
  stubFetch({ ok: true, status: 200, json: async () => [row] });
  assert.deepEqual(await fetchTopCoins(), [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'x.png', rank: 1, price: 62000, change24h: 1.2, marketCap: 1e12 }
  ]);
});

test('surfaces 429 as UpstreamError carrying Retry-After', async () => {
  stubFetch({ ok: false, status: 429, headers: new Headers({ 'retry-after': '30' }) });
  await assert.rejects(fetchTopCoins, (err: unknown) => err instanceof UpstreamError && err.retryAfterMs === 30_000);
});

test('rejects other bad statuses', async () => {
  stubFetch({ ok: false, status: 503, headers: new Headers() });
  await assert.rejects(fetchTopCoins, /unexpected status 503/);
});

test('rejects an empty payload', async () => {
  stubFetch({ ok: true, status: 200, json: async () => [] });
  await assert.rejects(fetchTopCoins, /empty or malformed/);
});

test('maps market_chart points to history ticks', async () => {
  stubFetch({ ok: true, status: 200, json: async () => ({ prices: [[1700000000000, 62000.5]] }) });
  assert.deepEqual(await fetchCoinHistory('bitcoin'), [{ ts: new Date(1700000000000), price: 62000.5 }]);
});

test('rejects a malformed history response', async () => {
  stubFetch({ ok: true, status: 200, json: async () => ({}) });
  await assert.rejects(() => fetchCoinHistory('bitcoin'), /malformed history/);
});
