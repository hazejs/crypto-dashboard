import type { UpstreamStatus } from '../../../../shared/types';
import { STR } from '../../strings';

export function UpstreamBanner({ upstream }: { upstream: UpstreamStatus }) {
  if (upstream.ok) return null;
  return (
    <div className="banner" role="status">
      {STR.upstreamBanner(upstream.lastError)}
    </div>
  );
}
