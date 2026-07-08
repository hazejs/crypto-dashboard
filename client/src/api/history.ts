import { API_PREFIX, HISTORY_DEFAULT_MINUTES } from '../../../shared/constants';
import type { HistoryResponse } from '../../../shared/types';

export async function fetchHistory(coinId: string, minutes: number = HISTORY_DEFAULT_MINUTES): Promise<HistoryResponse> {
  const res = await fetch(`${API_PREFIX}/coins/${encodeURIComponent(coinId)}/history?minutes=${minutes}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<HistoryResponse>;
}
