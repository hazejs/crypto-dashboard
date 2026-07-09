import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Coin } from '../../shared/types.ts';
import { createBackfill } from './backfill.ts';
import type { Db } from './db.ts';

const coin = (id: string): Coin => ({
  id,
  symbol: id,
  name: id,
  image: '',
  rank: 1,
  price: 1,
  change24h: 0,
  marketCap: 1
});

function fakeDb(recentCounts: Record<string, number>) {
  const inserted: { coinId: string }[] = [];
  const db = {
    ticks: {
      countDocuments: async ({ coinId }: { coinId: string }) => recentCounts[coinId] ?? 0,
      insertMany: async (docs: { coinId: string }[]) => inserted.push(...docs)
    }
  } as unknown as Db;
  return { db, inserted };
}

const points = [
  { ts: new Date('2026-01-01T00:00:00Z'), price: 100 },
  { ts: new Date('2026-01-01T00:05:00Z'), price: 101 }
];

test('backfills only coins without recent history', async () => {
  const { db, inserted } = fakeDb({ bitcoin: 0, ethereum: 12 });
  const fetched: string[] = [];
  const backfill = createBackfill({
    db,
    staggerMs: 0,
    fetchHistory: async (id) => {
      fetched.push(id);
      return points;
    }
  });
  await backfill.run([coin('bitcoin'), coin('ethereum')]);

  assert.deepEqual(fetched, ['bitcoin']);
  assert.equal(inserted.length, points.length);
  assert.equal(inserted[0].coinId, 'bitcoin');
});

test('continues past a coin whose backfill fails', async () => {
  const { db, inserted } = fakeDb({});
  const backfill = createBackfill({
    db,
    staggerMs: 0,
    fetchHistory: async (id) => {
      if (id === 'bitcoin') throw new Error('boom');
      return points;
    }
  });
  await backfill.run([coin('bitcoin'), coin('ethereum')]);

  assert.equal(inserted.length, points.length);
  assert.equal(inserted[0].coinId, 'ethereum');
});

test('ensure backfills a cold coin once, deduping concurrent requests', async () => {
  const { db, inserted } = fakeDb({ bitcoin: 0 });
  let calls = 0;
  const backfill = createBackfill({
    db,
    staggerMs: 0,
    fetchHistory: async () => {
      calls++;
      return points;
    }
  });
  await Promise.all([backfill.ensure('bitcoin'), backfill.ensure('bitcoin')]);

  assert.equal(calls, 1);
  assert.equal(inserted.length, points.length);
});

test('ensure skips coins that already have recent history', async () => {
  const { db } = fakeDb({ bitcoin: 12 });
  let calls = 0;
  const backfill = createBackfill({
    db,
    staggerMs: 0,
    fetchHistory: async () => {
      calls++;
      return points;
    }
  });
  assert.equal(await backfill.ensure('bitcoin'), false);
  assert.equal(calls, 0);
});

test('ensure cools down after a failed attempt instead of retrying every request', async () => {
  const { db } = fakeDb({ bitcoin: 0 });
  let calls = 0;
  const backfill = createBackfill({
    db,
    staggerMs: 0,
    fetchHistory: async () => {
      calls++;
      throw new Error('boom');
    }
  });
  await backfill.ensure('bitcoin');
  await backfill.ensure('bitcoin');
  assert.equal(calls, 1);
});
