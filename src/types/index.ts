export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in-progress' | 'done';

export interface MiniStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface BreakdownSection {
  id: string;
  title: string;
  steps: MiniStep[];
}

export interface TaskLink {
  id: string;
  label: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  projectId: string | null;
  dueDate: string | null;
  dueTime: string | null;
  tags: string[];
  links: TaskLink[];
  notes: string;
  breakdowns: BreakdownSection[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  emoji: string;
}

export interface GroveData {
  tasks: Task[];
  projects: Project[];
  version: number;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectInput = Omit<Project, 'id'>;
