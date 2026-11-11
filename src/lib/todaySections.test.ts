import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../types';
import { classifyTodaySections } from './todaySections';

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

const NOW = new Date(2026, 10, 10, 15, 30, 0);
const TODAY = '2026-11-10';

describe('classifyTodaySections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts a task due earlier today only as overdue, not as due today', () => {
    const earlier = makeTask({
      id: 'earlier',
      title: 'Due this morning',
      dueDate: TODAY,
      dueTime: '10:00',
    });
    const later = makeTask({
      id: 'later',
      title: 'Due this evening',
      dueDate: TODAY,
      dueTime: '18:00',
    });
    const noTime = makeTask({
      id: 'notime',
      title: 'Due today no time',
      dueDate: TODAY,
    });
    const past = makeTask({
      id: 'past',
      title: 'Due yesterday',
      dueDate: '2026-11-09',
    });

    const sections = classifyTodaySections([earlier, later, noTime, past], TODAY);
    expect(sections.overdue.map((t) => t.id).sort()).toEqual(['earlier', 'past']);
    expect(sections.todayTasks.map((t) => t.id)).toEqual(['notime', 'later']);
    expect(sections.todayTasks.some((t) => t.id === 'earlier')).toBe(false);
    expect(sections.overdue.some((t) => t.id === 'later')).toBe(false);
  });

  it('keeps each task in only one section', () => {
    const overdueInProgress = makeTask({
      id: 'oip',
      title: 'Overdue in progress',
      status: 'in-progress',
      dueDate: '2026-11-08',
    });
    const todayInProgress = makeTask({
      id: 'tip',
      title: 'Today in progress',
      status: 'in-progress',
      dueDate: TODAY,
      dueTime: '18:00',
    });
    const onlyProgress = makeTask({
      id: 'only',
      title: 'Open in progress',
      status: 'in-progress',
    });
    const upcoming = makeTask({
      id: 'up',
      title: 'Tomorrow',
      dueDate: '2026-11-11',
    });

    const sections = classifyTodaySections(
      [overdueInProgress, todayInProgress, onlyProgress, upcoming],
      TODAY,
    );
    const ids = [
      ...sections.overdue,
      ...sections.todayTasks,
      ...sections.upcoming,
      ...sections.inProgress,
    ].map((t) => t.id);
    expect(ids.sort()).toEqual(['oip', 'only', 'tip', 'up'].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(sections.overdue.map((t) => t.id)).toEqual(['oip']);
    expect(sections.todayTasks.map((t) => t.id)).toEqual(['tip']);
    expect(sections.upcoming.map((t) => t.id)).toEqual(['up']);
    expect(sections.inProgress.map((t) => t.id)).toEqual(['only']);
    expect(sections.inProgressCount).toBe(3);
    expect(sections.openCount).toBe(4);
  });

  it('sorts due-today tasks by due time and upcoming tasks by due date', () => {
    const evening = makeTask({ id: 'e', title: 'Evening', dueDate: TODAY, dueTime: '19:00' });
    const afternoon = makeTask({ id: 'a', title: 'Afternoon', dueDate: TODAY, dueTime: '16:00' });
    const later = makeTask({ id: 'l', title: 'Later week', dueDate: '2026-11-20' });
    const tomorrow = makeTask({ id: 't', title: 'Tomorrow', dueDate: '2026-11-11' });

    const sections = classifyTodaySections([evening, later, afternoon, tomorrow], TODAY);
    expect(sections.todayTasks.map((t) => t.id)).toEqual(['a', 'e']);
    expect(sections.upcoming.map((t) => t.id)).toEqual(['t', 'l']);
  });

  it('lists only the first five upcoming tasks and counts work finished today', () => {
    const upcoming = [1, 2, 3, 4, 5, 6].map((n) =>
      makeTask({
        id: `u${n}`,
        title: `Upcoming ${n}`,
        dueDate: `2026-11-${(11 + n).toString().padStart(2, '0')}`,
      }),
    );
    const doneToday = makeTask({
      id: 'done',
      title: 'Finished',
      status: 'done',
      updatedAt: '2026-11-10T18:00:00.000Z',
    });
    const doneEarlier = makeTask({
      id: 'old',
      title: 'Finished earlier',
      status: 'done',
      updatedAt: '2026-11-09T18:00:00.000Z',
    });

    const sections = classifyTodaySections([...upcoming, doneToday, doneEarlier], TODAY);
    expect(sections.upcoming).toHaveLength(5);
    expect(sections.upcoming.map((t) => t.id)).toEqual(['u1', 'u2', 'u3', 'u4', 'u5']);
    expect(sections.doneToday.map((t) => t.id)).toEqual(['done']);
    expect(sections.openCount).toBe(6);
  });
});