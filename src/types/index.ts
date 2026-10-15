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

export type RecurrenceFreq = 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Recurrence {
  freq: RecurrenceFreq;
  /** Repeat every N units; missing means 1 */
  interval?: number;
  /** Monthly only: the day of month to land on (1..31), clamped to short months */
  dayOfMonth?: number;
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
  /** Lifetime grant-once flag for Garden task XP */
  xpGranted?: boolean;
  /** Optional repeat rule; missing means the task does not repeat */
  recurrence?: Recurrence;
  /** Id of the next occurrence created when this one was completed (spawn-once guard) */
  spawnedNextId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  emoji: string;
}

export interface GardenState {
  weekKey: string; // current week id (Monday-start local week)
  weekXp: number; // XP this week (water + tasks)
  lastWateredDate: string | null; // yyyy-MM-dd
  taskXpByDay: Record<string, number>; // date -> task XP earned that day
}

export interface GroveData {
  tasks: Task[];
  projects: Project[];
  version: number;
  garden?: GardenState; // optional for backward compat; normalize on load
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectInput = Omit<Project, 'id'>;
