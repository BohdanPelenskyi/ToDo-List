'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTasks } from '@/features/tasks/use-tasks';
import { buildTasksHref, type TaskListParams } from '@/lib/task-filters';
import type { Task, TaskFilters, TaskStatus } from '@/types/api';
import { TaskStatusFilter } from './task-status-filter';
import { TasksContent } from './tasks-content';

interface TasksListViewProps {
  params: TaskListParams;
  filters: TaskFilters;
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

// The paginated, status-filtered list.
export function TasksListView({ params, filters, onCreate, ...handlers }: TasksListViewProps) {
  const router = useRouter();
  const tasks = useTasks(filters);

  const { data } = tasks;
  const lastPage = Math.max(data?.meta.totalPages ?? 1, 1);

  // Deleting the last task of the last page, or a stale link, can leave the URL past the end.
  useEffect(() => {
    if (data && !tasks.isPlaceholderData && params.page > lastPage) {
      router.replace(buildTasksHref({ status: params.status, page: lastPage }));
    }
  }, [data, tasks.isPlaceholderData, params.page, params.status, lastPage, router]);

  return (
    <>
      <div className="mb-5">
        <TaskStatusFilter active={params.status} />
      </div>
      <TasksContent query={tasks} status={params.status} onCreate={onCreate} {...handlers} />
    </>
  );
}
