import { SNAPSHOT_MESSAGE_TYPE, WS_PATH } from '../../../shared/constants';
import type { Snapshot, SnapshotMessage } from '../../../shared/types';

const SECURE_PAGE_PROTOCOL = 'https:';
const SECURE_WS_SCHEME = 'wss';
const PLAIN_WS_SCHEME = 'ws';
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 10_000;

export interface LiveSocketHandlers {
  onSnapshot: (snapshot: Snapshot) => void;
  onConnectionChange: (connected: boolean) => void;
}

export function createLiveSocket({ onSnapshot, onConnectionChange }: LiveSocketHandlers): () => void {
  let ws: WebSocket | null = null;
  let retryTimer: number | undefined;
  let retryMs = RETRY_BASE_MS;
  let disposed = false;

  function connect() {
    const scheme = location.protocol === SECURE_PAGE_PROTOCOL ? SECURE_WS_SCHEME : PLAIN_WS_SCHEME;
    ws = new WebSocket(`${scheme}://${location.host}${WS_PATH}`);
    ws.onopen = () => {
      retryMs = RETRY_BASE_MS;
      onConnectionChange(true);
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as SnapshotMessage;
      if (msg.type === SNAPSHOT_MESSAGE_TYPE) onSnapshot(msg);
    };
    ws.onclose = () => {
      onConnectionChange(false);
      if (disposed) return;
      retryTimer = window.setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, RETRY_MAX_MS);
    };
    ws.onerror = () => ws?.close();
  }
  connect();

  return () => {
    disposed = true;
    clearTimeout(retryTimer);
    ws?.close();
  };
}
