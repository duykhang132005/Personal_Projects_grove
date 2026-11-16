import { describe, expect, it } from 'vitest';
import {
  applyDailyWater,
  applyStreakIfQualified,
  computeTaskXpAward,
  createFreshGarden,
  DAILY_TASK_XP_CAP,
  ensureGardenWeek,
  FAST_COMPLETE_MS,
  groupPlantsByMonth,
  pastMonthBeds,
  priorityXp,
  STREAK_BONUS_CAP,
  STREAK_BONUS_PER_WEEK,
  streakBonus,
  WATER_XP,
  weekKeyNow,
  weekStartKey,
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
      taskXpByDay: {},
    };
    const same = ensureGardenWeek(current, day);
    expect(same.weekXp).toBe(80);
    expect(same.weekKey).toBe(current.weekKey);
  });

  it('archives the finished week plant at the weekly reset', () => {
    const inWeek = new Date(2026, 10, 11, 12, 0, 0);
    const laterWeek = new Date(2026, 10, 16, 12, 0, 0);
    const stale: GardenState = {
      weekKey: weekKeyNow(inWeek),
      weekStart: weekStartKey(inWeek),
      weekXp: 80,
      lastWateredDate: '2026-11-11',
      taskXpByDay: { '2026-11-11': 40 },
    };
    const rolled = ensureGardenWeek(stale, laterWeek);
    expect(rolled.weeklyPlants).toHaveLength(1);
    expect(rolled.weeklyPlants?.[0].weekKey).toBe(stale.weekKey);
    expect(rolled.weeklyPlants?.[0].weekStart).toBe(weekStartKey(inWeek));
    expect(rolled.weeklyPlants?.[0].weekXp).toBe(80);
    expect(rolled.weeklyPlants?.[0].stageId).toBe('sprout');
    expect(rolled.weekXp).toBe(0);
  });
});

describe('weekly streak', () => {
  const monday = new Date(2026, 10, 9, 12, 0, 0);
  const nextMonday = new Date(2026, 10, 16, 12, 0, 0);
  const twoWeeksLater = new Date(2026, 10, 23, 12, 0, 0);

  function qualifiedWeek(day: Date, streak = 0, bonusWeek: string | null = null): GardenState {
    const key = weekKeyNow(day);
    return {
      weekKey: key,
      weekStart: weekStartKey(day),
      weekXp: 40,
      lastWateredDate: formatDay(day),
      taskXpByDay: { [formatDay(day)]: 15 },
      currentStreak: streak,
      bestStreak: streak,
      streakBonusWeekKey: bonusWeek,
      weeklyPlants: [],
    };
  }

  function formatDay(day: Date): string {
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  it('qualifies a week after water and task XP, granting the bonus once', () => {
    expect(STREAK_BONUS_PER_WEEK).toBe(5);
    const base: GardenState = {
      weekKey: weekKeyNow(monday),
      weekStart: weekStartKey(monday),
      weekXp: 25,
      lastWateredDate: '2026-11-09',
      taskXpByDay: {},
      currentStreak: 0,
      bestStreak: 0,
      streakBonusWeekKey: null,
      weeklyPlants: [],
    };
    const wateredOnly = applyStreakIfQualified(base, monday);
    expect(wateredOnly.currentStreak).toBe(0);
    expect(wateredOnly.weekXp).toBe(25);

    const qualified: GardenState = {
      ...base,
      weekXp: 40,
      taskXpByDay: { '2026-11-09': 15 },
    };
    const first = applyStreakIfQualified(qualified, monday);
    expect(first.currentStreak).toBe(1);
    expect(first.bestStreak).toBe(1);
    expect(first.weekXp).toBe(45);
    expect(first.streakBonusWeekKey).toBe(weekKeyNow(monday));
    expect(first.taskXpByDay['2026-11-09']).toBe(15);

    const second = applyStreakIfQualified(first, monday);
    expect(second.currentStreak).toBe(1);
    expect(second.weekXp).toBe(45);
  });

  it('resets the current streak when the finished week did not qualify', () => {
    const unfinished: GardenState = {
      weekKey: weekKeyNow(monday),
      weekStart: weekStartKey(monday),
      weekXp: 25,
      lastWateredDate: '2026-11-09',
      taskXpByDay: {},
      currentStreak: 3,
      bestStreak: 4,
      streakBonusWeekKey: weekKeyNow(monday),
      weeklyPlants: [],
    };
    const rolled = ensureGardenWeek(unfinished, nextMonday);
    expect(rolled.currentStreak).toBe(0);
    expect(rolled.bestStreak).toBe(4);
    expect(rolled.weekKey).toBe(weekKeyNow(nextMonday));
  });

  it('resets the current streak when a week is missed', () => {
    const started = applyStreakIfQualified(qualifiedWeek(monday), monday);
    expect(started.currentStreak).toBe(1);
    const skipped = ensureGardenWeek(started, twoWeeksLater);
    expect(skipped.currentStreak).toBe(0);
    expect(skipped.bestStreak).toBe(1);
    expect(skipped.weeklyPlants).toHaveLength(1);
  });

  it('caps the streak bonus at 25 and does not grant it twice', () => {
    expect(streakBonus(5)).toBe(STREAK_BONUS_CAP);
    expect(streakBonus(6)).toBe(STREAK_BONUS_CAP);
    const ready: GardenState = {
      ...qualifiedWeek(monday, 4, null),
      weekXp: 40,
    };
    const first = applyStreakIfQualified(ready, monday);
    expect(first.currentStreak).toBe(5);
    expect(first.weekXp).toBe(65);
    const again = applyStreakIfQualified(first, monday);
    expect(again.currentStreak).toBe(5);
    expect(again.weekXp).toBe(65);
  });
});

describe('monthly grouping', () => {
  it('groups archived plants by calendar month of week start', () => {
    const plants = [
      { weekKey: '2026-W40', weekStart: '2026-09-28', weekXp: 20, stageId: 'seedling' as const },
      { weekKey: '2026-W41', weekStart: '2026-10-05', weekXp: 40, stageId: 'seedling' as const },
      { weekKey: '2026-W45', weekStart: '2026-11-02', weekXp: 80, stageId: 'sprout' as const },
      { weekKey: '2026-W46', weekStart: '2026-11-09', weekXp: 60, stageId: 'sprout' as const },
    ];
    const beds = groupPlantsByMonth(plants);
    expect(beds.map((b) => b.monthKey)).toEqual(['2026-11', '2026-10', '2026-09']);
    expect(beds[0].label).toBe('November 2026');
    expect(beds[0].totalXp).toBe(140);
    expect(beds[0].plants).toHaveLength(2);
    expect(beds[1].totalXp).toBe(40);

    const past = pastMonthBeds(plants, new Date(2026, 10, 15));
    expect(past.map((b) => b.monthKey)).toEqual(['2026-10', '2026-09']);
  });
});