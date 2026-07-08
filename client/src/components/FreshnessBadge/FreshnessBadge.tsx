import type { Snapshot } from '../../../../shared/types';
import { formatAge } from '../../format';
import { useTick } from '../../hooks/useTick';
import { STR } from '../../strings';

export function FreshnessBadge({ snapshot, connected }: { snapshot: Snapshot | null; connected: boolean }) {
  useTick(); // re-render each second so the age keeps climbing visibly

  if (!snapshot?.lastFetchAt) return <span className="badge stale">{STR.badgeNoData}</span>;

  const ageMs = Date.now() - new Date(snapshot.lastFetchAt).getTime();
  const age = formatAge(ageMs);

  if (!connected) return <span className="badge stale">{STR.badgeReconnecting(age)}</span>;
  if (ageMs > snapshot.staleAfterMs) return <span className="badge stale">{STR.badgeStale(age)}</span>;
  return (
    <span className="badge fresh">
      <span className="pulse" aria-hidden="true" /> {STR.badgeFresh(age)}
    </span>
  );
}
