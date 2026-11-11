import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import type { Task } from '../types';
import { isOverdue } from '../utils/format';

export function classifyTodaySections(tasks: Task[], todayStr: string) {
  const open = tasks.filter((t) => t.status !== 'done');
  const overdue = open.filter(isOverdue);
  const overdueIds = new Set(overdue.map((t) => t.id));
  const todayTasks = open
    .filter((t) => t.dueDate && isToday(parseISO(t.dueDate)) && !overdueIds.has(t.id))
    .sort((a, b) => (a.dueTime ?? '').localeCompare(b.dueTime ?? ''));
  const upcoming = open
    .filter((t) => {
      if (!t.dueDate) return false;
      const d = parseISO(t.dueDate);
      return isTomorrow(d) || (!isToday(d) && !isPast(d));
    })
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5);
  const inProgressCount = open.filter((t) => t.status === 'in-progress').length;
  // Each task appears in one section only: in-progress tasks that are already
  // listed as overdue, due today, or coming up are not repeated below.
  const listed = new Set([...overdue, ...todayTasks, ...upcoming].map((t) => t.id));
  const inProgress = open.filter(
    (t) => t.status === 'in-progress' && !listed.has(t.id)
  );
  const doneToday = tasks.filter(
    (t) =>
      t.status === 'done' &&
      format(parseISO(t.updatedAt), 'yyyy-MM-dd') === todayStr
  );
  return {
    todayTasks,
    upcoming,
    overdue,
    inProgress,
    inProgressCount,
    doneToday,
    openCount: open.length,
  };
}