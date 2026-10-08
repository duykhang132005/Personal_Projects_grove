import { useEffect, useState } from 'react';
import { todayKey } from '../utils/garden';

/** Small buffer so the timer fires just after local midnight, never just before. */
const MIDNIGHT_BUFFER_MS = 1000;

function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + MIDNIGHT_BUFFER_MS;
}

/**
 * Current local day key (yyyy-MM-dd). Re-renders the caller when the local date
 * changes while the app stays open: at local midnight, and again on window focus
 * or when the tab becomes visible (background tabs and sleep can delay timers).
 */
export function useToday(): string {
  const [day, setDay] = useState(() => todayKey());

  useEffect(() => {
    let timer = 0;

    function sync() {
      // Same string as before means React skips the re-render
      setDay(todayKey());
      window.clearTimeout(timer);
      timer = window.setTimeout(sync, msUntilNextLocalMidnight());
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') sync();
    }

    timer = window.setTimeout(sync, msUntilNextLocalMidnight());
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return day;
}
