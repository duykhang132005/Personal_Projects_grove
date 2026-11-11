import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroveData } from '../types';
import { CORRUPT_STORAGE_KEY, loadData, STORAGE_KEY } from './storage';

function installMemoryStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal('localStorage', localStorage);
  return store;
}

function sampleData(): GroveData {
  return {
    version: 1,
    projects: [
      {
        id: 'proj-audit',
        name: 'Audit project',
        color: '#5a8f6b',
        description: 'Kept on load',
        emoji: 'x',
      },
    ],
    tasks: [
      {
        id: 'task-audit-1',
        title: 'Saved task',
        description: '',
        status: 'todo',
        priority: 'medium',
        projectId: 'proj-audit',
        dueDate: null,
        dueTime: null,
        tags: [],
        links: [],
        notes: '',
        breakdowns: [],
        createdAt: '2026-11-01T12:00:00.000Z',
        updatedAt: '2026-11-01T12:00:00.000Z',
      },
    ],
  };
}

describe('loadData', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installMemoryStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to seed data and persists it when storage is empty', () => {
    const loaded = loadData();
    expect(Array.isArray(loaded.tasks)).toBe(true);
    expect(Array.isArray(loaded.projects)).toBe(true);
    expect(loaded.tasks.length).toBeGreaterThan(0);
    expect(loaded.projects.length).toBeGreaterThan(0);
    expect(store.has(STORAGE_KEY)).toBe(true);
    expect(store.get(STORAGE_KEY)).toContain('"tasks"');
  });

  it('falls back to seed data when stored JSON is corrupt', () => {
    store.set(STORAGE_KEY, '{not-json');
    const loaded = loadData();
    expect(Array.isArray(loaded.tasks)).toBe(true);
    expect(loaded.tasks.length).toBeGreaterThan(0);
    const saved = store.get(STORAGE_KEY) ?? '';
    expect(saved).not.toBe('{not-json');
    expect(saved.startsWith('{')).toBe(true);
  });

  it('backs up the original corrupt string and still returns the fallback', () => {
    const corrupt = '{not-json';
    store.set(STORAGE_KEY, corrupt);
    const loaded = loadData();
    expect(store.get(CORRUPT_STORAGE_KEY)).toBe(corrupt);
    expect(Array.isArray(loaded.tasks)).toBe(true);
    expect(loaded.tasks.length).toBeGreaterThan(0);
    expect(store.get(STORAGE_KEY)).not.toBe(corrupt);
  });

  it('falls back to seed data when tasks or projects are missing', () => {
    store.set(STORAGE_KEY, JSON.stringify({ version: 1, projects: [] }));
    const withoutTasks = loadData();
    expect(withoutTasks.tasks.length).toBeGreaterThan(0);
    expect(withoutTasks.projects.length).toBeGreaterThan(0);

    store.set(STORAGE_KEY, JSON.stringify({ version: 1, tasks: [] }));
    const withoutProjects = loadData();
    expect(withoutProjects.tasks.length).toBeGreaterThan(0);
    expect(withoutProjects.projects.length).toBeGreaterThan(0);
  });

  it('returns valid stored data for a good payload', () => {
    const payload = sampleData();
    store.set(STORAGE_KEY, JSON.stringify(payload));
    const loaded = loadData();
    expect(loaded.tasks.some((t) => t.id === 'task-audit-1')).toBe(true);
    expect(loaded.projects.some((p) => p.id === 'proj-audit')).toBe(true);
    const saved = JSON.parse(store.get(STORAGE_KEY) ?? '{}') as GroveData;
    expect(saved.tasks.some((t) => t.id === 'task-audit-1')).toBe(true);
  });
});