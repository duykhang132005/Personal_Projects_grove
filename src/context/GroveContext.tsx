import {
  useCallback,
  useEffect,
  useMemo,
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
import { GroveContext } from './grove-context';
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

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      garden: rollGarden(prev.garden),
      projects: prev.projects.filter((p) => p.id !== id),
      tasks: prev.tasks.map((t) =>
        t.projectId === id
          ? { ...t, projectId: null, updatedAt: new Date().toISOString() }
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
  }, []);

  const resetData = useCallback(() => {
    setData(withGarden(resetToSeed()));
  }, []);

  const garden = useMemo(
    () => ensureGardenWeek(data.garden ?? createFreshGarden()),
    [data.garden]
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
  }, [data.garden?.weekKey, data.garden?.weekXp, data.garden?.lastWateredDate]);

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
      resetData,
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
      resetData,
    ]
  );

  return (
    <GroveContext.Provider value={value}>{children}</GroveContext.Provider>
  );
}
