import { Router } from 'express';
import { HISTORY_DEFAULT_MINUTES, HISTORY_MAX_MINUTES, HISTORY_MIN_MINUTES } from '../../shared/constants.ts';
import type { HistoryResponse } from '../../shared/types.ts';
import type { Db } from './db.ts';
import type { Poller } from './poller.ts';

const COINS_ROUTE = '/coins';
const HISTORY_ROUTE = '/coins/:id/history';
const HEALTH_ROUTE = '/health';
const MS_PER_MINUTE = 60_000;

export function createRoutes({ db, poller }: { db: Db; poller: Poller }) {
  const router = Router();

  // Latest snapshot from the poller's in-memory state (seeded from the DB on
  // boot) — serving it costs no DB or upstream call.
  router.get(COINS_ROUTE, (_req, res) => {
    res.json(poller.snapshot());
  });

  // History comes from our own ticks collection, never from upstream.
  router.get(HISTORY_ROUTE, async (req, res, next) => {
    try {
      const coinId = req.params.id;
      const minutes = Math.min(
        Math.max(Number(req.query.minutes) || HISTORY_DEFAULT_MINUTES, HISTORY_MIN_MINUTES),
        HISTORY_MAX_MINUTES
      );
      const since = new Date(Date.now() - minutes * MS_PER_MINUTE);
      const ticks = await db.ticks.find({ coinId, ts: { $gte: since } }).sort({ ts: 1 }).toArray();
      const body: HistoryResponse = {
        coinId,
        minutes,
        points: ticks.map((t) => ({ ts: t.ts.toISOString(), price: t.price }))
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  });

  router.get(HEALTH_ROUTE, (_req, res) => {
    const { lastFetchAt, stale, upstream } = poller.snapshot();
    res.json({ ok: true, lastFetchAt, stale, upstream });
  });

  return router;
}
