export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: string | null): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}

type TaskSortField = 'createdAt' | 'updatedAt' | 'title' | 'status' | 'dueAt';

type SortOrder = 'asc' | 'desc';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** When the task is scheduled, as an ISO timestamp; null when it has no date. */
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  /** Inclusive ISO bounds of the due date, used by the calendar. */
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  limit?: number;
  sort?: TaskSortField;
  order?: SortOrder;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  dueAt?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;
