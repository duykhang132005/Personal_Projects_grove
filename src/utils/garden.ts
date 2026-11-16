import {
  addDays,
  addWeeks,
  differenceInCalendarWeeks,
  format,
  isBefore,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns';
import type { ArchivedPlant, GardenStageId, GardenState, Priority } from '../types';

export const WATER_XP = 25;
export const DAILY_TASK_XP_CAP = 100;
export const FAST_COMPLETE_MS = 2 * 60 * 1000;
export const STREAK_BONUS_PER_WEEK = 5;
export const STREAK_BONUS_CAP = 25;

export const STAGES = [
  { id: 'seedling', name: 'Seedling', minXp: 0, emoji: '🌱' },
  { id: 'sprout', name: 'Sprout', minXp: 50, emoji: '🌿' },
  { id: 'sapling', name: 'Sapling', minXp: 150, emoji: '🪴' },
  { id: 'young', name: 'Young tree', minXp: 350, emoji: '🌳' },
  { id: 'mature', name: 'Mature', minXp: 700, emoji: '🌲' },
  { id: 'ancient', name: 'Ancient', minXp: 1200, emoji: '🏞️' },
] as const;

export type StageId = (typeof STAGES)[number]['id'];

export function weekKeyNow(date: Date = new Date()): string {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, "yyyy-'W'II");
}

export function todayKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/** Local date at midnight from a yyyy-MM-dd key, avoiding UTC parse shifts */
export function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, date ?? 1);
}

export function weekStartKey(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function monthKeyFromDay(day: string): string {
  return day.slice(0, 7);
}

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return format(new Date(year, (month ?? 1) - 1, 1), 'MMMM yyyy');
}

/** Resolve a weekKey (yyyy-WII, using the same format as weekKeyNow) to its Monday */
export function weekStartFromKey(weekKey: string): string | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return null;
  const year = Number(match[1]);
  let cursor = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 });
  cursor = addWeeks(cursor, -3);
  for (let i = 0; i < 70; i += 1) {
    if (weekKeyNow(cursor) === weekKey) return format(cursor, 'yyyy-MM-dd');
    cursor = addWeeks(cursor, 1);
  }
  return null;
}

export function resolveWeekStart(state: GardenState, date: Date = new Date()): string {
  if (state.weekStart && /^\d{4}-\d{2}-\d{2}$/.test(state.weekStart)) {
    return state.weekStart;
  }
  return weekStartFromKey(state.weekKey) ?? weekStartKey(date);
}

export function datesInWeek(weekStart: string): string[] {
  const start = parseDay(weekStart);
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

export function weekTaskXp(state: GardenState, weekStart: string): number {
  return datesInWeek(weekStart).reduce((sum, day) => sum + (state.taskXpByDay[day] ?? 0), 0);
}

export function weekWasWatered(state: GardenState, weekStart: string): boolean {
  const last = state.lastWateredDate;
  if (!last) return false;
  return datesInWeek(weekStart).includes(last);
}

/** A week counts when the user watered at least once and earned some task XP */
export function weekQualifies(state: GardenState, weekStart: string): boolean {
  return weekWasWatered(state, weekStart) && weekTaskXp(state, weekStart) > 0;
}

export function streakBonus(streak: number): number {
  if (streak <= 0) return 0;
  return Math.min(STREAK_BONUS_CAP, STREAK_BONUS_PER_WEEK * streak);
}

export function weeksApart(fromStart: string, toStart: string): number {
  return differenceInCalendarWeeks(parseDay(toStart), parseDay(fromStart), {
    weekStartsOn: 1,
  });
}

export function yesterdayKey(date: Date = new Date()): string {
  return format(subDays(date, 1), 'yyyy-MM-dd');
}

export function createFreshGarden(date: Date = new Date()): GardenState {
  return {
    weekKey: weekKeyNow(date),
    weekStart: weekStartKey(date),
    weekXp: 0,
    lastWateredDate: null,
    taskXpByDay: {},
    currentStreak: 0,
    bestStreak: 0,
    streakBonusWeekKey: null,
    weeklyPlants: [],
  };
}

function asStageId(id: string): GardenStageId {
  const match = STAGES.find((s) => s.id === id);
  return (match?.id ?? 'seedling') as GardenStageId;
}

export function withGardenDefaults(state: GardenState, date: Date = new Date()): GardenState {
  return {
    weekKey: state.weekKey,
    weekStart: resolveWeekStart(state, date),
    weekXp: state.weekXp ?? 0,
    lastWateredDate: state.lastWateredDate ?? null,
    taskXpByDay: state.taskXpByDay ?? {},
    currentStreak: state.currentStreak ?? 0,
    bestStreak: state.bestStreak ?? 0,
    streakBonusWeekKey: state.streakBonusWeekKey ?? null,
    weeklyPlants: Array.isArray(state.weeklyPlants) ? state.weeklyPlants : [],
  };
}

function plantFromWeek(state: GardenState, date: Date = new Date()): ArchivedPlant {
  const weekStart = resolveWeekStart(state, date);
  const weekXp = state.weekXp ?? 0;
  return {
    weekKey: state.weekKey,
    weekStart,
    weekXp,
    stageId: asStageId(stageForXp(weekXp).stage.id),
  };
}

function weekHadActivity(state: GardenState, weekStart: string): boolean {
  return (state.weekXp ?? 0) > 0 || weekWasWatered(state, weekStart) || weekTaskXp(state, weekStart) > 0;
}

/**
 * If this week now qualifies and the bonus has not been granted yet, bump the
 * streak and add the capped bonus to weekXp only (not taskXpByDay).
 */
export function applyStreakIfQualified(
  state: GardenState,
  date: Date = new Date(),
): GardenState {
  const garden = withGardenDefaults(state, date);
  if (garden.streakBonusWeekKey === garden.weekKey) return garden;
  if (!weekQualifies(garden, garden.weekStart ?? resolveWeekStart(garden, date))) {
    return garden;
  }
  const currentStreak = (garden.currentStreak ?? 0) + 1;
  const bestStreak = Math.max(garden.bestStreak ?? 0, currentStreak);
  const bonus = streakBonus(currentStreak);
  return {
    ...garden,
    currentStreak,
    bestStreak,
    streakBonusWeekKey: garden.weekKey,
    weekXp: (garden.weekXp ?? 0) + bonus,
  };
}

/**
 * Roll weekXp to 0 when weekKey is outdated; keep lastWateredDate for wilt logic.
 * Archives the finished week's plant and updates the streak when a week is missed.
 */
export function ensureGardenWeek(
  state: GardenState | undefined | null,
  date: Date = new Date()
): GardenState {
  const current = weekKeyNow(date);
  const currentStart = weekStartKey(date);
  if (!state) return createFreshGarden(date);
  if (state.weekKey === current) {
    return applyStreakIfQualified(withGardenDefaults(state, date), date);
  }

  const finished = withGardenDefaults(state, date);
  const finishedStart = finished.weekStart ?? resolveWeekStart(finished, date);
  const alreadyArchived = finished.weeklyPlants!.some((p) => p.weekKey === finished.weekKey);
  const weeklyPlants =
    !alreadyArchived && weekHadActivity(finished, finishedStart)
      ? [...finished.weeklyPlants!, plantFromWeek(finished, date)]
      : finished.weeklyPlants!;

  const qualified = weekQualifies(finished, finishedStart);
  const gap = weeksApart(finishedStart, currentStart);
  let currentStreak = finished.currentStreak ?? 0;
  let bestStreak = finished.bestStreak ?? 0;
  if (!qualified || gap > 1) {
    currentStreak = 0;
  } else if (finished.streakBonusWeekKey !== finished.weekKey) {
    currentStreak += 1;
    bestStreak = Math.max(bestStreak, currentStreak);
  }

  return {
    weekKey: current,
    weekStart: currentStart,
    weekXp: 0,
    lastWateredDate: finished.lastWateredDate ?? null,
    taskXpByDay: finished.taskXpByDay ?? {},
    currentStreak,
    bestStreak,
    streakBonusWeekKey: null,
    weeklyPlants,
  };
}

export interface MonthBed {
  monthKey: string;
  label: string;
  plants: ArchivedPlant[];
  totalXp: number;
}

export function groupPlantsByMonth(plants: ArchivedPlant[]): MonthBed[] {
  const map = new Map<string, ArchivedPlant[]>();
  const sorted = [...plants].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  for (const plant of sorted) {
    const key = monthKeyFromDay(plant.weekStart);
    const list = map.get(key) ?? [];
    list.push(plant);
    map.set(key, list);
  }
  return [...map.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((monthKey) => {
      const list = map.get(monthKey) ?? [];
      return {
        monthKey,
        label: monthLabel(monthKey),
        plants: list,
        totalXp: list.reduce((sum, plant) => sum + plant.weekXp, 0),
      };
    });
}

export function pastMonthBeds(plants: ArchivedPlant[], today: Date = new Date()): MonthBed[] {
  const currentMonth = format(today, 'yyyy-MM');
  return groupPlantsByMonth(plants).filter((bed) => bed.monthKey < currentMonth);
}

export function thisMonthPlants(
  plants: ArchivedPlant[],
  today: Date = new Date(),
): ArchivedPlant[] {
  const currentMonth = format(today, 'yyyy-MM');
  return plants
    .filter((plant) => monthKeyFromDay(plant.weekStart) === currentMonth)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function stageFromId(id: string): (typeof STAGES)[number] {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export function priorityXp(priority: Priority): number {
  switch (priority) {
    case 'low':
      return 5;
    case 'medium':
      return 10;
    case 'high':
      return 15;
    case 'urgent':
      return 20;
    default:
      return 10;
  }
}

export function computeTaskXpAward(opts: {
  priority: Priority;
  createdAt: string;
  completedAt?: Date;
  alreadyGranted?: boolean;
  taskXpUsedToday: number;
}): { computed: number; awarded: number; capped: boolean; skipped: boolean } {
  if (opts.alreadyGranted) {
    return { computed: 0, awarded: 0, capped: false, skipped: true };
  }
  const completedAt = opts.completedAt ?? new Date();
  let base = priorityXp(opts.priority);
  const createdMs = Date.parse(opts.createdAt);
  if (
    Number.isFinite(createdMs) &&
    completedAt.getTime() - createdMs < FAST_COMPLETE_MS
  ) {
    base = Math.floor(base / 2);
  }
  const used = opts.taskXpUsedToday ?? 0;
  const remaining = Math.max(0, DAILY_TASK_XP_CAP - used);
  const awarded = Math.min(base, remaining);
  return {
    computed: base,
    awarded,
    capped: awarded < base,
    skipped: false,
  };
}

export type Stage = (typeof STAGES)[number];

export function stageForXp(xp: number) {
  let current: Stage = STAGES[0];
  for (const stage of STAGES) {
    if (xp >= stage.minXp) current = stage;
  }
  const idx = STAGES.findIndex((s) => s.id === current.id);
  const next: Stage | null =
    idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
  const floor = current.minXp;
  const ceiling = next ? next.minXp : current.minXp;
  const into = Math.max(0, xp - floor);
  const span = Math.max(1, ceiling - floor);
  const progress = next ? Math.min(1, into / span) : 1;
  return {
    stage: current,
    next,
    xpIntoStage: into,
    xpForNext: next ? ceiling - xp : 0,
    progress,
  };
}

/** Wilted when last watered is before yesterday (missed ≥1 full day), or never watered. */
export function isWilted(
  lastWateredDate: string | null,
  date: Date = new Date()
): boolean {
  if (!lastWateredDate) return true;
  const yesterday = yesterdayKey(date);
  try {
    return isBefore(parseISO(lastWateredDate), parseISO(yesterday));
  } catch {
    return true;
  }
}

export function wateredToday(
  lastWateredDate: string | null,
  date: Date = new Date()
): boolean {
  return lastWateredDate === todayKey(date);
}

/** Water once per local day: +WATER_XP, not capped. No-ops if already watered that day. */
export function applyDailyWater(
  garden: GardenState,
  date: Date = new Date(),
): { garden: GardenState; watered: boolean; reason?: string } {
  const rolled = ensureGardenWeek(garden, date);
  if (wateredToday(rolled.lastWateredDate, date)) {
    return { garden: rolled, watered: false, reason: 'already-watered' };
  }
  return {
    garden: applyStreakIfQualified(
      {
        ...rolled,
        weekXp: (rolled.weekXp ?? 0) + WATER_XP,
        lastWateredDate: todayKey(date),
      },
      date,
    ),
    watered: true,
  };
}
