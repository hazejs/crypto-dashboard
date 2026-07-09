import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Coin, Snapshot } from '../../shared/types.ts';
import { UpstreamError } from './coingecko.ts';
import type { CoinDoc, Db } from './db.ts';
import { createPoller } from './poller.ts';

const coin: Coin = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'x.png',
  rank: 1,
  price: 62000,
  change24h: 1.2,
  marketCap: 1e12
};

function fakeDb(seed: CoinDoc[] = []) {
  const writes: unknown[] = [];
  const ticks: unknown[] = [];
  const db = {
    coins: {
      find: () => ({ sort: () => ({ toArray: async () => seed }) }),
      bulkWrite: async (ops: unknown[]) => writes.push(...ops)
    },
    ticks: { insertMany: async (docs: unknown[]) => ticks.push(...docs) }
  } as unknown as Db;
  return { db, writes, ticks };
}

test('serves fresh data and persists it on a successful poll', async () => {
  const { db, writes, ticks } = fakeDb();
  const updates: Snapshot[] = [];
  const poller = createPoller({ db, onUpdate: (s) => updates.push(s), fetchCoins: async () => [coin] });
  await poller.start();
  poller.stop();

  const snap = poller.snapshot();
  assert.deepEqual(snap.coins, [coin]);
  assert.equal(snap.stale, false);
  assert.equal(snap.upstream.ok, true);
  assert.equal(updates.length, 1);
  assert.equal(writes.length, 2);
  assert.equal(ticks.length, 1);
});

test('keeps last-known-good data and reports the failure when upstream is down', async () => {
  const seeded: CoinDoc = { ...coin, _id: coin.id, updatedAt: new Date('2026-01-01T00:00:00Z') };
  const { db } = fakeDb([seeded]);
  const poller = createPoller({
    db,
    onUpdate: () => {},
    fetchCoins: async () => {
      throw new UpstreamError('rate limited (HTTP 429)', 60_000);
    }
  });
  await poller.start();
  poller.stop();

  const snap = poller.snapshot();
  assert.deepEqual(snap.coins, [coin]);
  assert.equal(snap.upstream.ok, false);
  assert.equal(snap.upstream.consecutiveFailures, 1);
  assert.equal(snap.upstream.lastError, 'rate limited (HTTP 429)');
  assert.equal(snap.stale, true);
  assert.equal(snap.lastFetchAt, '2026-01-01T00:00:00.000Z');
});
