import { useEffect, useState } from 'react';
import type { Snapshot } from '../../../shared/types';
import { createLiveSocket } from '../live/socket';

export interface LiveData {
  snapshot: Snapshot | null;
  connected: boolean;
  failedAttempts: number;
}

export function useLiveData(): LiveData {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(
    () =>
      createLiveSocket({
        onSnapshot: setSnapshot,
        onConnectionChange: (up) => {
          setConnected(up);
          setFailedAttempts(up ? 0 : (n) => n + 1);
        }
      }),
    []
  );

  return { snapshot, connected, failedAttempts };
}
