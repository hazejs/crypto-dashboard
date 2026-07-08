import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { API_PREFIX, WS_PATH } from '../../shared/constants.ts';
import { createBackfill } from './backfill.ts';
import { config } from './config.ts';
import { connectDb } from './db.ts';
import { createPoller } from './poller.ts';
import { createRoutes } from './routes.ts';
import { createHub, type Hub } from './ws.ts';

const CLIENT_DIST_RELATIVE = '../../../client/dist';
const INDEX_HTML = 'index.html';
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

const clientDist = path.resolve(fileURLToPath(import.meta.url), CLIENT_DIST_RELATIVE);

const db = await connectDb();

const app = express();
app.disable('x-powered-by');

let hub: Hub | undefined;
const backfill = createBackfill({ db });
let backfillStarted = false;

const poller = createPoller({
  db,
  onUpdate: (snap) => {
    hub?.broadcast(snap);
    // After the first successful poll we know the coin list — seed history for
    // a cold database so the detail chart has data right away.
    if (!backfillStarted && snap.upstream.ok) {
      backfillStarted = true;
      backfill.run(snap.coins).catch((err) => console.error('history backfill failed:', err));
    }
  }
});

app.use(API_PREFIX, createRoutes({ db, poller }));

// In production the server also serves the built frontend (single origin, no
// CORS). In dev the Vite dev server handles this and proxies /api and /ws here.
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith(API_PREFIX) && req.path !== WS_PATH) {
      res.sendFile(path.join(clientDist, INDEX_HTML));
    } else {
      next();
    }
  });
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const server = http.createServer(app);
hub = createHub(server, () => poller.snapshot());

server.listen(config.port, () => {
  console.log(`listening on http://localhost:${config.port}`);
});

// Not awaited: the app must come up (and serve last-known-good data) even if
// the first upstream fetch is slow or failing.
poller.start().catch((err) => console.error('poller failed to start:', err));

for (const signal of SHUTDOWN_SIGNALS) {
  process.on(signal, async () => {
    poller.stop();
    backfill.stop();
    hub?.close();
    server.close();
    await db.client.close();
    process.exit(0);
  });
}
