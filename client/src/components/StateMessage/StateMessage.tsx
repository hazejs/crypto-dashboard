import type { ReactNode } from 'react';

export function StateMessage({ error = false, children }: { error?: boolean; children: ReactNode }) {
  return <div className={error ? 'state error' : 'state'}>{children}</div>;
}
