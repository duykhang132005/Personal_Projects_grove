import { format, startOfWeek, subDays, parseISO, isBefore } from 'date-fns';
import type { GardenState, Priority } from '../types';

export const WATER_XP = 25;
export const DAILY_TASK_XP_CAP = 100;
export const FAST_COMPLETE_MS = 2 * 60 * 1000;

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

export function yesterdayKey(date: Date = new Date()): string {
  return format(subDays(date, 1), 'yyyy-MM-dd');
}

export function createFreshGarden(date: Date = new Date()): GardenState {
  return {
    weekKey: weekKeyNow(date),
    weekXp: 0,
    lastWateredDate: null,
    taskXpByDay: {},
  };
}

/** Roll weekXp to 0 when weekKey is outdated; keep lastWateredDate for wilt logic. */
export function ensureGardenWeek(
  state: GardenState | undefined | null,
  date: Date = new Date()
): GardenState {
  const current = weekKeyNow(date);
  if (!state) return createFreshGarden(date);
  if (state.weekKey === current) {
    return {
      weekKey: state.weekKey,
      weekXp: state.weekXp ?? 0,
      lastWateredDate: state.lastWateredDate ?? null,
      taskXpByDay: state.taskXpByDay ?? {},
    };
  }
  return {
    weekKey: current,
    weekXp: 0,
    lastWateredDate: state.lastWateredDate ?? null,
    taskXpByDay: state.taskXpByDay ?? {},
  };
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
