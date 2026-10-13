import { useEffect, useState } from 'react';

/**
 * Current time (ms), refreshed on each interval boundary (default once a minute)
 * and when the window regains focus. Call it once per page, not per list item,
 * so time-based badges like "Overdue" re-render without a manual refresh.
 */
export function useNow(intervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer = 0;

    function tick() {
      setNow(Date.now());
      window.clearTimeout(timer);
      // Line up with the next boundary (e.g. the start of the next minute)
      timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') tick();
    }

    timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs]);

  return now;
}
