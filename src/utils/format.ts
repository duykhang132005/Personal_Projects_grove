import { format, parseISO, isToday, isPast, isTomorrow } from 'date-fns';
import type { Priority, Status, Task } from '../types';

export function formatDue(task: Task): string | null {
  if (!task.dueDate) return null;
  try {
    const d = parseISO(task.dueDate);
    let datePart: string;
    if (isToday(d)) datePart = 'Today';
    else if (isTomorrow(d)) datePart = 'Tomorrow';
    else datePart = format(d, 'MMM d');
    if (task.dueTime) return `${datePart} · ${task.dueTime}`;
    return datePart;
  } catch {
    return task.dueDate;
  }
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  try {
    const d = parseISO(task.dueDate);
    if (isToday(d)) {
      if (!task.dueTime) return false;
      const [h, m] = task.dueTime.split(':').map(Number);
      const now = new Date();
      return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
    }
    return isPast(d) && !isToday(d);
  } catch {
    return false;
  }
}

export function priorityLabel(p: Priority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function statusLabel(s: Status): string {
  if (s === 'in-progress') return 'In progress';
  if (s === 'done') return 'Done';
  return 'To do';
}

export function taskProgress(task: Task): { done: number; total: number } {
  const steps = task.breakdowns.flatMap((b) => b.steps);
  const total = steps.length;
  const done = steps.filter((s) => s.completed).length;
  return { done, total };
}
