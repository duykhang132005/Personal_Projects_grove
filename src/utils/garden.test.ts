import { describe, expect, it } from 'vitest';
import {
  applyDailyWater,
  computeTaskXpAward,
  createFreshGarden,
  DAILY_TASK_XP_CAP,
  ensureGardenWeek,
  FAST_COMPLETE_MS,
  priorityXp,
  WATER_XP,
  weekKeyNow,
} from './garden';
import type { GardenState } from '../types';

describe('priorityXp', () => {
  it('uses weights low 5, medium 10, high 15, urgent 20', () => {
    expect(priorityXp('low')).toBe(5);
    expect(priorityXp('medium')).toBe(10);
    expect(priorityXp('high')).toBe(15);
    expect(priorityXp('urgent')).toBe(20);
  });
});

describe('computeTaskXpAward', () => {
  it('grants XP only once when alreadyGranted is set', () => {
    const first = computeTaskXpAward({
      priority: 'urgent',
      createdAt: '2026-11-01T12:00:00.000Z',
      completedAt: new Date('2026-11-10T15:00:00.000Z'),
      alreadyGranted: false,
      taskXpUsedToday: 0,
    });
    expect(first.skipped).toBe(false);
    expect(first.awarded).toBe(20);

    const second = computeTaskXpAward({
      priority: 'urgent',
      createdAt: '2026-11-01T12:00:00.000Z',
      completedAt: new Date('2026-11-10T16:00:00.000Z'),
      alreadyGranted: true,
      taskXpUsedToday: first.awarded,
    });
    expect(second.skipped).toBe(true);
    expect(second.awarded).toBe(0);
    expect(second.computed).toBe(0);
  });

  it('halves XP when the task was created less than 2 minutes before completion', () => {
    const completedAt = new Date('2026-11-10T15:00:00.000Z');
    const fastCreated = new Date(completedAt.getTime() - FAST_COMPLETE_MS + 1000).toISOString();
    const slowCreated = new Date(completedAt.getTime() - FAST_COMPLETE_MS - 1000).toISOString();

    const fast = computeTaskXpAward({
      priority: 'medium',
      createdAt: fastCreated,
      completedAt,
      taskXpUsedToday: 0,
    });
    expect(fast.awarded).toBe(5);
    expect(fast.computed).toBe(5);

    const slow = computeTaskXpAward({
      priority: 'medium',
      createdAt: slowCreated,
      completedAt,
      taskXpUsedToday: 0,
    });
    expect(slow.awarded).toBe(10);
    expect(slow.computed).toBe(10);
  });

  it('caps task XP at 100 per day', () => {
    expect(DAILY_TASK_XP_CAP).toBe(100);
    const partial = computeTaskXpAward({
      priority: 'urgent',
      createdAt: '2026-11-01T12:00:00.000Z',
      completedAt: new Date('2026-11-10T15:00:00.000Z'),
      taskXpUsedToday: 95,
    });
    expect(partial.awarded).toBe(5);
    expect(partial.computed).toBe(20);
    expect(partial.capped).toBe(true);

    const exhausted = computeTaskXpAward({
      priority: 'high',
      createdAt: '2026-11-01T12:00:00.000Z',
      completedAt: new Date('2026-11-10T16:00:00.000Z'),
      taskXpUsedToday: 100,
    });
    expect(exhausted.awarded).toBe(0);
    expect(exhausted.capped).toBe(true);
  });
});

describe('applyDailyWater', () => {
  it('adds 25 XP the first time in a local day and not again that day', () => {
    expect(WATER_XP).toBe(25);
    const day = new Date(2026, 10, 10, 9, 0, 0);
    const fresh = createFreshGarden(day);
    const first = applyDailyWater(fresh, day);
    expect(first.watered).toBe(true);
    expect(first.garden.weekXp).toBe(25);
    expect(first.garden.lastWateredDate).toBe('2026-11-10');

    const second = applyDailyWater(first.garden, new Date(2026, 10, 10, 21, 0, 0));
    expect(second.watered).toBe(false);
    expect(second.reason).toBe('already-watered');
    expect(second.garden.weekXp).toBe(25);
    expect(second.garden.lastWateredDate).toBe('2026-11-10');
  });

  it('allows watering again on the next local day', () => {
    const monday = new Date(2026, 10, 10, 18, 0, 0);
    const afterFirst = applyDailyWater(createFreshGarden(monday), monday).garden;
    const tuesday = new Date(2026, 10, 11, 8, 0, 0);
    const nextDay = applyDailyWater(afterFirst, tuesday);
    expect(nextDay.watered).toBe(true);
    expect(nextDay.garden.weekXp).toBe(50);
    expect(nextDay.garden.lastWateredDate).toBe('2026-11-11');
  });
});

describe('ensureGardenWeek', () => {
  it('resets week XP when the week key is stale and keeps last watered date', () => {
    const inWeek = new Date(2026, 10, 11, 12, 0, 0);
    const laterWeek = new Date(2026, 10, 16, 12, 0, 0);
    const stale: GardenState = {
      weekKey: weekKeyNow(inWeek),
      weekXp: 80,
      lastWateredDate: '2026-11-11',
      taskXpByDay: { '2026-11-11': 40 },
    };
    const rolled = ensureGardenWeek(stale, laterWeek);
    expect(rolled.weekKey).toBe(weekKeyNow(laterWeek));
    expect(rolled.weekKey).not.toBe(stale.weekKey);
    expect(rolled.weekXp).toBe(0);
    expect(rolled.lastWateredDate).toBe('2026-11-11');
    expect(rolled.taskXpByDay).toEqual({ '2026-11-11': 40 });
  });

  it('keeps week XP when the garden is already on the current week', () => {
    const day = new Date(2026, 10, 11, 12, 0, 0);
    const current: GardenState = {
      weekKey: weekKeyNow(day),
      weekXp: 80,
      lastWateredDate: '2026-11-11',
      taskXpByDay: { '2026-11-11': 40 },
    };
    const same = ensureGardenWeek(current, day);
    expect(same.weekXp).toBe(80);
    expect(same.weekKey).toBe(current.weekKey);
  });
});