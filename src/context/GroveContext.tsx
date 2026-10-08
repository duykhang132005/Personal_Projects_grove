import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  GardenState,
  GroveData,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '../types';
import {
  exportJson,
  importJson,
  loadData,
  resetToSeed,
  saveData,
} from '../data/storage';
import { uid } from '../utils/id';
import { GroveContext, type ToastKind, type ToastState } from './grove-context';
import { useToday } from '../hooks/useToday';
import {
  WATER_XP,
  computeTaskXpAward,
  createFreshGarden,
  ensureGardenWeek,
  todayKey,
  wateredToday,
} from '../utils/garden';

function emptyTask(title: string): Task {
  const now = new Date().toISOString();
  return {
    id: uid('task'),
    title,
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
    createdAt: now,
    updatedAt: now,
  };
}

function withGarden(data: GroveData): GroveData {
  return {
    ...data,
    garden: ensureGardenWeek(data.garden ?? createFreshGarden()),
  };
}

export function GroveProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GroveData>(() => withGarden(loadData()));
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  // Restore function for the toast currently on screen (null when there is nothing to undo)
  const undoAction = useRef<(() => void) | null>(null);
  const toastSeq = useRef(0);
  // Local day key; changes at local midnight so the garden week roll is re-checked
  const today = useToday();

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const rollGarden = useCallback((garden: GardenState | undefined): GardenState => {
    return ensureGardenWeek(garden ?? createFreshGarden());
  }, []);

  const addTask = useCallback((input: Partial<TaskInput> & { title: string }) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...emptyTask(input.title),
      ...input,
      id: uid('task'),
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      garden: rollGarden(prev.garden),
      tasks: [...prev.tasks, task],
    }));
    return task;
  }, [rollGarden]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((prev) => {
      let garden = rollGarden(prev.garden);
      const tasks = prev.tasks.map((t) => {
        if (t.id !== id) return t;

        const nextStatus = patch.status ?? t.status;
        const becomingDone =
          nextStatus === 'done' && t.status !== 'done';

        let nextTask: Task = {
          ...t,
          ...patch,
          id: t.id,
          updatedAt: new Date().toISOString(),
        };

        if (becomingDone && !t.xpGranted) {
          const day = todayKey();
          const used = garden.taskXpByDay[day] ?? 0;
          const { awarded } = computeTaskXpAward({
            priority: nextTask.priority,
            createdAt: t.createdAt,
            alreadyGranted: false,
            taskXpUsedToday: used,
          });

          // Grant-once lifetime: mark xpGranted on first done transition
          // even when awarded is 0 (daily cap exhausted).
          nextTask = { ...nextTask, xpGranted: true };

          garden = {
            ...garden,
            weekXp: (garden.weekXp ?? 0) + awarded,
            taskXpByDay: {
              ...garden.taskXpByDay,
              [day]: used + awarded,
            },
          };
        }

        return nextTask;
      });

      return { ...prev, tasks, garden };
    });
  }, [rollGarden]);

  const deleteTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      garden: rollGarden(prev.garden),
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, [rollGarden]);

  const addProject = useCallback((input: ProjectInput) => {
    const project: Project = { ...input, id: uid('proj') };
    setData((prev) => ({
      ...prev,
      garden: rollGarden(prev.garden),
      projects: [...prev.projects, project],
    }));
    return project;
  }, [rollGarden]);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      garden: rollGarden(prev.garden),
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...patch, id: p.id } : p
      ),
    }));
  }, [rollGarden]);

  // stamp lets deleteProjectWithUndo recognise the updatedAt this delete wrote
  const deleteProject = useCallback((id: string, stamp?: string) => {
    const detachedAt = stamp ?? new Date().toISOString();
    setData((prev) => ({
      ...prev,
      garden: rollGarden(prev.garden),
      projects: prev.projects.filter((p) => p.id !== id),
      tasks: prev.tasks.map((t) =>
        t.projectId === id
          ? { ...t, projectId: null, updatedAt: detachedAt }
          : t
      ),
    }));
  }, [rollGarden]);

  const getTask = useCallback(
    (id: string) => data.tasks.find((t) => t.id === id),
    [data]
  );
  const getProject = useCallback(
    (id: string) => data.projects.find((p) => p.id === id),
    [data]
  );

  const waterPlant = useCallback(() => {
    let result: { watered: boolean; reason?: string } = { watered: false };
    setData((prev) => {
      const garden = rollGarden(prev.garden);
      if (wateredToday(garden.lastWateredDate)) {
        result = { watered: false, reason: 'already-watered' };
        return { ...prev, garden };
      }
      const next: GardenState = {
        ...garden,
        weekXp: (garden.weekXp ?? 0) + WATER_XP,
        lastWateredDate: todayKey(),
      };
      result = { watered: true };
      return { ...prev, garden: next };
    });
    return result;
  }, [rollGarden]);

  const exportData = useCallback(() => exportJson(withGarden(data)), [data]);

  const importData = useCallback((json: string) => {
    setData(withGarden(importJson(json)));
    // Imported data replaces everything, so a pending Undo no longer applies
    undoAction.current = null;
    setToast(null);
  }, []);

  const resetData = useCallback(() => {
    setData(withGarden(resetToSeed()));
  }, []);

  const openToast = useCallback(
    (message: string, kind: ToastKind, restore: (() => void) | null) => {
      undoAction.current = restore;
      toastSeq.current += 1;
      setToast({ id: toastSeq.current, message, kind });
    },
    []
  );

  const showNotice = useCallback(
    (message: string, kind: 'info' | 'error' = 'info') => {
      openToast(message, kind, null);
    },
    [openToast]
  );

  const undo = useCallback(() => {
    const restore = undoAction.current;
    undoAction.current = null;
    setToast(null);
    restore?.();
  }, []);

  const dismissToast = useCallback(() => {
    undoAction.current = null;
    setToast(null);
  }, []);

  // Targeted undo: puts back only the deleted task (same id, same position),
  // so XP and edits made while the toast is showing are kept.
  const deleteTaskWithUndo = useCallback(
    (id: string) => {
      const index = data.tasks.findIndex((t) => t.id === id);
      if (index === -1) return;
      const removed = data.tasks[index];
      deleteTask(id);
      openToast('Task deleted', 'undo', () => {
        setData((prev) => {
          if (prev.tasks.some((t) => t.id === removed.id)) return prev;
          const tasks = [...prev.tasks];
          tasks.splice(Math.min(index, tasks.length), 0, removed);
          return { ...prev, tasks };
        });
      });
    },
    [data.tasks, deleteTask, openToast]
  );

  // Targeted undo: deleteProject keeps its tasks and only clears their projectId,
  // so Undo puts the project back (same position) and re-attaches exactly those tasks.
  const deleteProjectWithUndo = useCallback(
    (id: string) => {
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return;
      const removed = data.projects[index];
      // task id -> updatedAt before the delete touched it
      const detached = new Map(
        data.tasks
          .filter((t) => t.projectId === id)
          .map((t) => [t.id, t.updatedAt] as const)
      );
      const stamp = new Date().toISOString();
      deleteProject(id, stamp);
      openToast(`Project “${removed.name}” deleted`, 'undo', () => {
        setData((prev) => {
          const projects = prev.projects.some((p) => p.id === removed.id)
            ? prev.projects
            : [
                ...prev.projects.slice(0, index),
                removed,
                ...prev.projects.slice(index),
              ];
          const tasks = prev.tasks.map((t) => {
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
          return { ...prev, projects, tasks };
        });
      });
    },
    [data.projects, data.tasks, deleteProject, openToast]
  );

  // today is a dependency so a new local week is picked up while the app stays open
  // Whole-data action, so a full snapshot undo is intentional here: anything
  // changed while this toast is showing is replaced by the pre-reset data.
  const resetDataWithUndo = useCallback(() => {
    const snapshot = data;
    resetData();
    openToast('Sample data restored', 'undo', () => setData(snapshot));
  }, [data, resetData, openToast]);

  const garden = useMemo(
    () => ensureGardenWeek(data.garden ?? createFreshGarden()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.garden, today]
  );

  // Persist week roll once when garden read detects a new week
  useEffect(() => {
    const rolled = ensureGardenWeek(data.garden ?? createFreshGarden());
    if (
      !data.garden ||
      data.garden.weekKey !== rolled.weekKey ||
      data.garden.weekXp !== rolled.weekXp
    ) {
      setData((prev) => {
        const next = ensureGardenWeek(prev.garden ?? createFreshGarden());
        if (
          prev.garden &&
          prev.garden.weekKey === next.weekKey &&
          prev.garden.weekXp === next.weekXp
        ) {
          return prev;
        }
        return { ...prev, garden: next };
      });
    }
    // intentionally only when stored garden identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.garden?.weekKey, data.garden?.weekXp, data.garden?.lastWateredDate, today]);

  const value = useMemo(
    () => ({
      ready,
      tasks: data.tasks,
      projects: data.projects,
      garden,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      getTask,
      getProject,
      waterPlant,
      exportData,
      importData,
      deleteTaskWithUndo,
      deleteProjectWithUndo,
      showNotice,
      toast,
      undo,
      dismissToast,
      resetData,
      resetDataWithUndo,
    }),
    [
      ready,
      data,
      garden,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      getTask,
      getProject,
      waterPlant,
      exportData,
      importData,
      deleteTaskWithUndo,
      deleteProjectWithUndo,
      showNotice,
      toast,
      undo,
      dismissToast,
      resetData,
      resetDataWithUndo,
    ]
  );

  return (
    <GroveContext.Provider value={value}>{children}</GroveContext.Provider>
  );
}
