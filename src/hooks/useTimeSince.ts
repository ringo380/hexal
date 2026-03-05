// useTimeSince - Returns a relative time string like "Xs ago" / "Xm ago" from a timestamp
import { useState, useEffect } from 'react';

export function useTimeSince(timestamp: number | null): string | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (timestamp === null) return;
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (timestamp === null) return null;

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
