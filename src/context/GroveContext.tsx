import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
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

export function GroveProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GroveData>(() => loadData());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addTask = useCallback((input: Partial<TaskInput> & { title: string }) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...emptyTask(input.title),
      ...input,
      id: uid('task'),
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    return task;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? { ...t, ...patch, id: t.id, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const addProject = useCallback((input: ProjectInput) => {
    const project: Project = { ...input, id: uid('proj') };
    setData((prev) => ({ ...prev, projects: [...prev.projects, project] }));
    return project;
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...patch, id: p.id } : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      tasks: prev.tasks.map((t) =>
        t.projectId === id
          ? { ...t, projectId: null, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  }, []);

  const getTask = useCallback(
    (id: string) => data.tasks.find((t) => t.id === id),
    [data]
  );
  const getProject = useCallback(
    (id: string) => data.projects.find((p) => p.id === id),
    [data]
  );

  const exportData = useCallback(() => exportJson(data), [data]);

  const importData = useCallback((json: string) => {
    setData(importJson(json));
  }, []);

  const resetData = useCallback(() => {
    setData(resetToSeed());
  }, []);

  const value = useMemo(
    () => ({
      ready,
      tasks: data.tasks,
      projects: data.projects,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      getTask,
      getProject,
      exportData,
      importData,
      resetData,
    }),
    [
      ready,
      data,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      getTask,
      getProject,
      exportData,
      importData,
      resetData,
    ]
  );

  return (
    <GroveContext.Provider value={value}>{children}</GroveContext.Provider>
  );
}
