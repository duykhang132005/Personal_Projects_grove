import { createContext } from 'react';
import type {
  GardenState,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '../types';

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
  resetData: () => void;
}

export const GroveContext = createContext<GroveContextValue | null>(null);
