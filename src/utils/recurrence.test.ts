import { describe, expect, it } from 'vitest';
import { nextDueDate, normalizeRecurrence } from './recurrence';

describe('nextDueDate', () => {
  it('advances a daily task by one day', () => {
    expect(nextDueDate('2026-01-15', { freq: 'daily' }, '2026-01-15')).toBe('2026-01-16');
  });

  it('moves a weekday task from Friday to Monday', () => {
    // 2026-01-16 is a Friday
    expect(nextDueDate('2026-01-16', { freq: 'weekdays' }, '2026-01-16')).toBe('2026-01-19');
  });

  it('advances a weekly task by one week', () => {
    expect(nextDueDate('2026-01-15', { freq: 'weekly' }, '2026-01-15')).toBe('2026-01-22');
  });

  it('clamps a monthly task from January 31 to February 28', () => {
    expect(
      nextDueDate('2026-01-31', { freq: 'monthly', dayOfMonth: 31 }, '2026-01-31')
    ).toBe('2026-02-28');
  });

  it('returns to day 31 in March after a January 31 start', () => {
    expect(
      nextDueDate('2026-01-31', { freq: 'monthly', dayOfMonth: 31 }, '2026-03-01')
    ).toBe('2026-03-31');
  });

  it('honors an interval greater than 1', () => {
    expect(nextDueDate('2026-01-15', { freq: 'daily', interval: 3 }, '2026-01-15')).toBe(
      '2026-01-18'
    );
    expect(nextDueDate('2026-01-15', { freq: 'weekly', interval: 2 }, '2026-01-15')).toBe(
      '2026-01-29'
    );
    expect(nextDueDate('2026-01-15', { freq: 'monthly', interval: 2 }, '2026-01-15')).toBe(
      '2026-03-15'
    );
  });

  it('catches up an old due date to today', () => {
    expect(nextDueDate('2026-01-01', { freq: 'daily' }, '2026-01-10')).toBe('2026-01-10');
  });
});

describe('normalizeRecurrence', () => {
  it('keeps a valid daily rule', () => {
    expect(normalizeRecurrence({ freq: 'daily' })).toEqual({ freq: 'daily' });
  });

  it('keeps a valid interval and monthly dayOfMonth', () => {
    expect(normalizeRecurrence({ freq: 'monthly', interval: 2, dayOfMonth: 31 })).toEqual({
      freq: 'monthly',
      interval: 2,
      dayOfMonth: 31,
    });
  });

  it('returns undefined for missing or invalid fields', () => {
    expect(normalizeRecurrence(undefined)).toBeUndefined();
    expect(normalizeRecurrence(null)).toBeUndefined();
    expect(normalizeRecurrence({})).toBeUndefined();
    expect(normalizeRecurrence({ freq: 'yearly' })).toBeUndefined();
    expect(normalizeRecurrence({ freq: 'weekly', interval: 1 })).toEqual({ freq: 'weekly' });
    expect(normalizeRecurrence({ freq: 'weekly', interval: 100 })).toEqual({ freq: 'weekly' });
    expect(normalizeRecurrence({ freq: 'daily', dayOfMonth: 15 })).toEqual({ freq: 'daily' });
    expect(normalizeRecurrence({ freq: 'monthly', dayOfMonth: 0 })).toEqual({ freq: 'monthly' });
  });
});