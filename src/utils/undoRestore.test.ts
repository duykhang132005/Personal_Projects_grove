import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../types';
import { restoreDeletedProject, restoreDeletedTask } from './undoRestore';

function makeTask(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    description: '',
    status: 'todo',
    priority: 'medium',
    projectId: null,
    dueDate: null,
    dueTime: null,
    tags: [],
    links: [],
    notes: '',
    breakdowns: [],
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    ...partial,
  };
}

const alpha = makeTask({ id: 'a', title: 'Alpha', notes: 'keep me' });
const bravo = makeTask({ id: 'b', title: 'Bravo', projectId: 'p1' });
const charlie = makeTask({ id: 'c', title: 'Charlie' });

const project: Project = {
  id: 'p1',
  name: 'Grove',
  color: '#5a8f6b',
  description: 'Main',
  emoji: 'x',
};

describe('restoreDeletedTask', () => {
  it('puts a deleted task back intact at its original index', () => {
    const remaining = [alpha, charlie];
    const restored = restoreDeletedTask(remaining, bravo, 1);
    expect(restored.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(restored[1]).toEqual(bravo);
    expect(restored[1].title).toBe('Bravo');
    expect(restored[1].projectId).toBe('p1');
  });

  it('does not insert a second copy if the task is already present', () => {
    const all = [alpha, bravo, charlie];
    const again = restoreDeletedTask(all, bravo, 1);
    expect(again).toBe(all);
  });
});

describe('restoreDeletedProject', () => {
  it('puts a deleted project back and re-attaches its detached tasks intact', () => {
    const stamp = '2026-11-10T15:00:00.000Z';
    const originalUpdatedAt = '2026-11-01T12:00:00.000Z';
    const detachedTask = makeTask({
      id: 'b',
      title: 'Bravo',
      projectId: null,
      notes: 'still mine',
      updatedAt: stamp,
    });
    const other = makeTask({ id: 'c', title: 'Other', projectId: 'p2' });
    const detached = new Map<string, string>([['b', originalUpdatedAt]]);
    const { projects, tasks } = restoreDeletedProject(
      [],
      [detachedTask, other],
      project,
      0,
      detached,
      stamp,
    );

    expect(projects).toEqual([project]);
    expect(tasks[0].projectId).toBe('p1');
    expect(tasks[0].title).toBe('Bravo');
    expect(tasks[0].notes).toBe('still mine');
    expect(tasks[0].updatedAt).toBe(originalUpdatedAt);
    expect(tasks[1].projectId).toBe('p2');
  });

  it('leaves a task that was reassigned after the delete attached to its new project', () => {
    const stamp = '2026-11-10T15:00:00.000Z';
    const reassigned = makeTask({
      id: 'b',
      title: 'Bravo',
      projectId: 'p2',
      updatedAt: stamp,
    });
    const detached = new Map<string, string>([['b', '2026-11-01T12:00:00.000Z']]);
    const { tasks } = restoreDeletedProject(
      [],
      [reassigned],
      project,
      0,
      detached,
      stamp,
    );
    expect(tasks[0].projectId).toBe('p2');
    expect(tasks[0].updatedAt).toBe(stamp);
  });
});