import type { GroveData } from '../types';
import { createSeedData } from './seed';

const STORAGE_KEY = 'grove-data-v1';

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
    return parsed;
  } catch {
    const seed = createSeedData();
    saveData(seed);
    return seed;
  }
}

export function saveData(data: GroveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportJson(data: GroveData): string {
  return JSON.stringify(data, null, 2);
}

export function importJson(json: string): GroveData {
  const parsed = JSON.parse(json) as GroveData;
  if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) {
    throw new Error('Invalid Grove data: missing tasks or projects');
  }
  parsed.version = parsed.version ?? 1;
  saveData(parsed);
  return parsed;
}

export function resetToSeed(): GroveData {
  const seed = createSeedData();
  saveData(seed);
  return seed;
}
