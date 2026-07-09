import { useEffect, useState } from 'react';

export function useTick(intervalMs = 1000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return tick;
}
