import type { GroveData } from '../types';
import { createSeedData } from './seed';
import { ensureGardenWeek, createFreshGarden } from '../utils/garden';

const STORAGE_KEY = 'grove-data-v1';

function normalizeGroveData(data: GroveData): GroveData {
  return {
    ...data,
    version: data.version ?? 1,
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    garden: ensureGardenWeek(data.garden ?? createFreshGarden()),
  };
}

export function loadData(): GroveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      saveData(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as GroveData;
    if (!parsed.tasks || !parsed.projects) {
      const seed = createSeedData();
      saveData(seed);
      return seed;
    }
    const normalized = normalizeGroveData(parsed);
    // Persist week roll / missing garden so state stays consistent
    if (
      !parsed.garden ||
      parsed.garden.weekKey !== normalized.garden!.weekKey ||
      parsed.garden.weekXp !== normalized.garden!.weekXp
    ) {
      saveData(normalized);
    }
    return normalized;
  } catch {
    const seed = createSeedData();
    saveData(seed);
    return seed;
  }
}

export function saveData(data: GroveData): void {
  const normalized = normalizeGroveData(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function exportJson(data: GroveData): string {
  return JSON.stringify(normalizeGroveData(data), null, 2);
}

export function importJson(json: string): GroveData {
  const parsed = JSON.parse(json) as GroveData;
  if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) {
    throw new Error('Invalid Grove data: missing tasks or projects');
  }
  const normalized = normalizeGroveData(parsed);
  saveData(normalized);
  return normalized;
}

export function resetToSeed(): GroveData {
  const seed = createSeedData();
  saveData(seed);
  return seed;
}
