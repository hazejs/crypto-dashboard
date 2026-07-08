import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { SNAPSHOT_MESSAGE_TYPE, WS_PATH } from '../../shared/constants.ts';
import type { Snapshot, SnapshotMessage } from '../../shared/types.ts';

const HEARTBEAT_INTERVAL_MS = 30_000;

export interface Hub {
  broadcast(snapshot: Snapshot): void;
  close(): void;
}

export function createHub(httpServer: Server, getSnapshot: () => Snapshot): Hub {
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });
  const alive = new WeakSet<WebSocket>();

  const message = (snapshot: Snapshot): string =>
    JSON.stringify({ type: SNAPSHOT_MESSAGE_TYPE, ...snapshot } satisfies SnapshotMessage);

  wss.on('connection', (ws) => {
    alive.add(ws);
    ws.on('pong', () => alive.add(ws));
    ws.on('error', (err) => console.warn(`ws client error: ${err.message}`));
    ws.send(message(getSnapshot()));
  });

  // Terminate dead connections so broadcasts don't pile up on zombie sockets.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) {
        ws.terminate();
        continue;
      }
      alive.delete(ws);
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  return {
    broadcast(snapshot) {
      const msg = message(snapshot);
      for (const ws of wss.clients) {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      }
    },
    close() {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.terminate();
      wss.close();
    }
  };
}
