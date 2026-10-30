import { isTaskStatus, type TaskStatus } from '@/types/api';
import { isValidDayKey } from './calendar';
import { ROUTES } from './routes';

export const TASKS_PAGE_SIZE = 10;

export const TASK_VIEWS = ['list', 'board', 'calendar'] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export interface TaskListParams {
  view: TaskView;
  status?: TaskStatus;
  page: number;
  /** Calendar month as "YYYY-MM". */
  month?: string;
  /** Selected calendar day as "YYYY-MM-DD". */
  day?: string;
}

interface SearchParamsReader {
  get: (name: string) => string | null;
}

function isTaskView(value: string | null): value is TaskView {
  return TASK_VIEWS.some((view) => view === value);
}

function isMonthKey(value: string | null): value is string {
  return value !== null && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// Anything unrecognized in a hand-edited URL falls back to the defaults instead of erroring.
export function parseTaskListParams(searchParams: SearchParamsReader): TaskListParams {
  const view = searchParams.get('view');
  const status = searchParams.get('status');
  const month = searchParams.get('month');
  const day = searchParams.get('day');
  const page = Number(searchParams.get('page'));

  return {
    view: isTaskView(view) ? view : 'list',
    status: isTaskStatus(status) ? status : undefined,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    month: isMonthKey(month) ? month : undefined,
    day: day !== null && isValidDayKey(day) ? day : undefined,
  };
}

// Defaults (list view, first page) are left out so the common URLs stay short.
export function buildTasksHref({
  view = 'list',
  status,
  page = 1,
  month,
  day,
}: Partial<TaskListParams>): string {
  const query = new URLSearchParams();
  if (view !== 'list') query.set('view', view);
  if (status) query.set('status', status);
  if (page > 1) query.set('page', String(page));
  if (month) query.set('month', month);
  if (day) query.set('day', day);

  const search = query.toString();
  return search ? `${ROUTES.tasks}?${search}` : ROUTES.tasks;
}
