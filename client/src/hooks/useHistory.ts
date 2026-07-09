import { useEffect, useState } from 'react';
import type { HistoryPoint } from '../../../shared/types';
import { fetchHistory } from '../api/history';

export interface HistoryState {
  points: HistoryPoint[] | null;
  error: string | null;
}

export function useHistory(coinId: string, refreshKey: string | null): HistoryState {
  const [points, setPoints] = useState<HistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(coinId)
      .then((data) => {
        if (cancelled) return;
        setPoints(data.points);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [coinId, refreshKey]);

  return { points, error };
}
