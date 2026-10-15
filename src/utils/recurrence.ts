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

const UNIT_SINGULAR: Record<RecurrenceFreq, string> = {
  daily: 'day',
  weekdays: 'weekday',
  weekly: 'week',
  monthly: 'month',
};

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

export const MAX_INTERVAL = 99;

/** Unit word after "Every N", e.g. "week" or "weeks". */
export function intervalUnit(freq: RecurrenceFreq, n: number): string {
  return n === 1 ? UNIT_SINGULAR[freq] : UNIT_PLURAL[freq];
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
  const { freq, interval, dayOfMonth } = value as {
    freq?: unknown;
    interval?: unknown;
    dayOfMonth?: unknown;
  };
  if (typeof freq !== 'string' || !isRecurrenceFreq(freq)) return undefined;
  const out: Recurrence = { freq };
  if (
    typeof interval === 'number' &&
    Number.isInteger(interval) &&
    interval > 1 &&
    interval <= MAX_INTERVAL
  ) {
    out.interval = interval;
  }
  if (
    freq === 'monthly' &&
    typeof dayOfMonth === 'number' &&
    Number.isInteger(dayOfMonth) &&
    dayOfMonth >= 1 &&
    dayOfMonth <= 31
  ) {
    out.dayOfMonth = dayOfMonth;
  }
  return out;
}

/**
 * Monthly rules remember the day of month to land on; other kinds drop it.
 * Keeps an existing dayOfMonth unless `force` is set (e.g. the user picked a
 * new due date), otherwise takes it from `dueDate` (yyyy-MM-dd).
 */
export function withDayOfMonth(r: Recurrence, dueDate: string, force = false): Recurrence {
  const out: Recurrence = { freq: r.freq };
  if (r.interval && r.interval > 1) out.interval = r.interval;
  if (r.freq !== 'monthly') return out;
  out.dayOfMonth = !force && r.dayOfMonth ? r.dayOfMonth : getDate(parseISO(dueDate));
  return out;
}

/** Drops an invalid recurrence from a loaded or imported task; other tasks pass through. */
export function withNormalizedRecurrence(task: Task): Task {
  if (task.recurrence == null) return task;
  return { ...task, recurrence: normalizeRecurrence(task.recurrence) };
}

/**
 * One repeat step after `from`. Monthly lands on `anchorDay` (the rule's
 * dayOfMonth), clamped to month end, so it does not drift (Jan 31, Feb 28, Mar 31).
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
  // Old data without dayOfMonth falls back to the current due date's day
  const anchorDay = r.dayOfMonth ?? getDate(start);
  let next = step(start, r, anchorDay);
  // Guard against runaway loops on bad data (about 27 years of daily steps)
  for (let i = 0; i < 10000 && isBefore(next, todayDate); i += 1) {
    next = step(next, r, anchorDay);
  }
  return format(next, 'yyyy-MM-dd');
}
