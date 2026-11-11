import type { Project, Task } from '../types';

/** Puts a deleted task back at its original index if it is not already present. */
export function restoreDeletedTask(tasks: Task[], removed: Task, index: number): Task[] {
  if (tasks.some((t) => t.id === removed.id)) return tasks;
  const next = [...tasks];
  next.splice(Math.min(index, next.length), 0, removed);
  return next;
}

/**
 * Puts a deleted project back at its original index and re-attaches tasks this
 * delete detached (same id, and only rolls back the updatedAt the delete wrote).
 */
export function restoreDeletedProject(
  projects: Project[],
  tasks: Task[],
  removed: Project,
  index: number,
  detached: ReadonlyMap<string, string>,
  stamp: string,
): { projects: Project[]; tasks: Task[] } {
  const nextProjects = projects.some((p) => p.id === removed.id)
    ? projects
    : [
        ...projects.slice(0, index),
        removed,
        ...projects.slice(index),
      ];
  const nextTasks = tasks.map((t) => {
    const originalUpdatedAt = detached.get(t.id);
    // Leave tasks this delete did not detach, or that were reassigned since
    if (originalUpdatedAt === undefined || t.projectId !== null) return t;
    return {
      ...t,
      projectId: removed.id,
      // Roll back only the timestamp the delete itself wrote
      updatedAt: t.updatedAt === stamp ? originalUpdatedAt : t.updatedAt,
    };
  });
  return { projects: nextProjects, tasks: nextTasks };
}