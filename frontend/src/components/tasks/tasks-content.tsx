import type { useTasks } from '@/features/tasks/use-tasks';
import type { Task, TaskStatus } from '@/types/api';
import { Pagination } from './pagination';
import { TaskList } from './task-list';
import { TaskListSkeleton } from './task-list-skeleton';
import { TasksEmptyState } from './tasks-empty-state';
import { TasksErrorState } from './tasks-error-state';

interface TasksContentProps {
  query: ReturnType<typeof useTasks>;
  status: TaskStatus | undefined;
  onCreate: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

// Picks what to show for the list: the error, the skeleton, the empty state or the tasks.
export function TasksContent({ query, status, onCreate, ...handlers }: TasksContentProps) {
  const { data } = query;

  if (query.isError) {
    return (
      <TasksErrorState
        onRetry={() => {
          void query.refetch();
        }}
        isRetrying={query.isFetching}
      />
    );
  }
  if (!data) return <TaskListSkeleton />;
  if (data.items.length === 0) return <TasksEmptyState status={status} onCreate={onCreate} />;

  return (
    <>
      <TaskList tasks={data.items} isRefreshing={query.isPlaceholderData} {...handlers} />
      <Pagination meta={data.meta} status={status} />
    </>
  );
}
