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

  assert.deepEqual(fetched, ['bitcoin']); // ethereum already has history
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

  assert.equal(inserted.length, points.length); // ethereum still backfilled
  assert.equal(inserted[0].coinId, 'ethereum');
});
