import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDate,
  getDaysInMonth,
  isBefore,
  isWeekend,
  parseISO,
  setDate,
  startOfMonth,
} from 'date-fns';
import type { Recurrence, RecurrenceFreq, Task } from '../types';

export const RECURRENCE_OPTIONS: { value: RecurrenceFreq; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const UNIT_PLURAL: Record<RecurrenceFreq, string> = {
  daily: 'days',
  weekdays: 'weekdays',
  weekly: 'weeks',
  monthly: 'months',
};

const FREQS = RECURRENCE_OPTIONS.map((o) => o.value);

export function isRecurrenceFreq(value: string): value is RecurrenceFreq {
  return (FREQS as string[]).includes(value);
}

/** Short label for badges, e.g. "Weekly" or "Every 2 weeks". */
export function recurrenceLabel(r: Recurrence): string {
  const n = r.interval ?? 1;
  if (n <= 1) {
    return RECURRENCE_OPTIONS.find((o) => o.value === r.freq)?.label ?? r.freq;
  }
  return `Every ${n} ${UNIT_PLURAL[r.freq]}`;
}

/** Returns a valid Recurrence, or undefined for missing or malformed data (old exports). */
export function normalizeRecurrence(value: unknown): Recurrence | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { freq, interval } = value as { freq?: unknown; interval?: unknown };
  if (typeof freq !== 'string' || !isRecurrenceFreq(freq)) return undefined;
  if (typeof interval === 'number' && Number.isInteger(interval) && interval > 1) {
    return { freq, interval };
  }
  return { freq };
}

/** Drops an invalid recurrence from a loaded or imported task; other tasks pass through. */
export function withNormalizedRecurrence(task: Task): Task {
  if (task.recurrence == null) return task;
  return { ...task, recurrence: normalizeRecurrence(task.recurrence) };
}

/**
 * One repeat step after `from`. Monthly lands on `anchorDay` (the original day of
 * month), clamped to month end, so rolling forward does not drift (31st, 30th, 31st).
 */
function step(from: Date, r: Recurrence, anchorDay: number): Date {
  const n = Math.max(1, r.interval ?? 1);
  switch (r.freq) {
    case 'daily':
      return addDays(from, n);
    case 'weekly':
      return addWeeks(from, n);
    case 'weekdays': {
      let d = from;
      let left = n;
      while (left > 0) {
        d = addDays(d, 1);
        if (!isWeekend(d)) left -= 1;
      }
      return d;
    }
    case 'monthly': {
      const month = addMonths(startOfMonth(from), n);
      return setDate(month, Math.min(anchorDay, getDaysInMonth(month)));
    }
  }
}

/**
 * Next due date (yyyy-MM-dd) after `dueDate`. If that lands before `today`
 * (yyyy-MM-dd), keeps stepping until it is on or after today.
 */
export function nextDueDate(dueDate: string, r: Recurrence, today: string): string {
  const todayDate = parseISO(today);
  const start = parseISO(dueDate);
  const anchorDay = getDate(start);
  let next = step(start, r, anchorDay);
  // Guard against runaway loops on bad data (about 27 years of daily steps)
  for (let i = 0; i < 10000 && isBefore(next, todayDate); i += 1) {
    next = step(next, r, anchorDay);
  }
  return format(next, 'yyyy-MM-dd');
}
