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
  /** Optional second button next to Undo, e.g. "Open" */
  actionLabel?: string;
  /** Accessible name for that button */
  actionAriaLabel?: string;
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
  /** onOpen adds an "Open" button that restores the task (if needed) and calls onOpen(id) */
  deleteTaskWithUndo: (id: string, onOpen?: (id: string) => void) => void;
  /** Deletes a project; the toast's Undo restores it and re-attaches its tasks. */
  deleteProjectWithUndo: (id: string) => void;
  /** Shows a toast without an Undo button, e.g. an import error. */
  showNotice: (message: string, kind?: 'info' | 'error') => void;
  /** Visible toasts, oldest first (at most 3); each Undo toast has its own restore */
  toasts: ToastState[];
  undo: (id: number) => void;
  dismissToast: (id: number) => void;
  /** Runs a toast's extra action (after its Undo, if still pending) and closes it */
  runToastAction: (id: number) => void;
  resetData: () => void;
  /** Resets to sample data; Undo restores a full snapshot (whole-data action). */
  resetDataWithUndo: () => void;
}

export const GroveContext = createContext<GroveContextValue | null>(null);
