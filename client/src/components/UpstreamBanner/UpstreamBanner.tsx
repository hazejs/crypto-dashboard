import type { UpstreamStatus } from '../../../../shared/types';
import { STR } from '../../strings';

// Shown while the server reports upstream failures but keeps serving
// last-known-good data — the failure is visible, never a blank screen.
export function UpstreamBanner({ upstream }: { upstream: UpstreamStatus }) {
  if (upstream.ok) return null;
  return (
    <div className="banner" role="status">
      {STR.upstreamBanner(upstream.lastError)}
    </div>
  );
}
