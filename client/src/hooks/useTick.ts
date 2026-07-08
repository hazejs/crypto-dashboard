import { useEffect, useState } from 'react';

// Re-render on an interval — keeps relative times ("updated 4s ago") ticking.
export function useTick(intervalMs = 1000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return tick;
}
