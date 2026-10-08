import { createContext } from 'react';
import type {
  GardenState,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '../types';

export type ToastKind = 'undo' | 'info' | 'error';

export interface ToastState {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface GroveContextValue {
  ready: boolean;
  tasks: Task[];
  projects: Project[];
  garden: GardenState;
  addTask: (input: Partial<TaskInput> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (input: ProjectInput) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  getProject: (id: string) => Project | undefined;
  waterPlant: () => { watered: boolean; reason?: string };
  exportData: () => string;
  importData: (json: string) => void;
  /** Deletes a task; the toast's Undo puts back just that task. */
  deleteTaskWithUndo: (id: string) => void;
  /** Deletes a project; the toast's Undo restores it and re-attaches its tasks. */
  deleteProjectWithUndo: (id: string) => void;
  /** Shows a toast without an Undo button, e.g. an import error. */
  showNotice: (message: string, kind?: 'info' | 'error') => void;
  toast: ToastState | null;
  undo: () => void;
  dismissToast: () => void;
  resetData: () => void;
  /** Resets to sample data; Undo restores a full snapshot (whole-data action). */
  resetDataWithUndo: () => void;
}

export const GroveContext = createContext<GroveContextValue | null>(null);
