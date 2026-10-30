import { isTaskStatus, TASK_STATUSES, type Task, type TaskStatus } from '@/types/api';

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const status of TASK_STATUSES) {
    grouped[status] = tasks.filter((task) => task.status === status);
  }
  return grouped;
}

// The status a dropped card should take, or null when nothing changes (dropped outside a column
// or back into its own column).
export function resolveDrop(
  task: Task,
  overId: string | number | null | undefined,
): TaskStatus | null {
  if (typeof overId !== 'string' || !isTaskStatus(overId)) return null;
  return overId === task.status ? null : overId;
}
