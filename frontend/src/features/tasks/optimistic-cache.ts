import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { tasksKeys } from '@/lib/query-keys';
import type { Paginated, Task, UpdateTaskInput } from '@/types/api';

export type ListsSnapshot = [QueryKey, Paginated<Task> | undefined][];

// Applies `updater` to every cached task list (any filter or page) and returns what to restore.
async function updateCachedLists(
  queryClient: QueryClient,
  updater: (page: Paginated<Task>) => Paginated<Task>,
): Promise<ListsSnapshot> {
  // An in-flight refetch would otherwise overwrite the optimistic value when it lands.
  await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });
  const snapshot = queryClient.getQueriesData<Paginated<Task>>({ queryKey: tasksKeys.lists() });

  queryClient.setQueriesData<Paginated<Task>>(
    { queryKey: tasksKeys.lists() },
    (page) => page && updater(page),
  );
  return snapshot;
}

export function applyOptimisticUpdate(
  queryClient: QueryClient,
  id: string,
  changes: UpdateTaskInput,
): Promise<ListsSnapshot> {
  return updateCachedLists(queryClient, (page) => ({
    ...page,
    items: page.items.map((task) => (task.id === id ? { ...task, ...changes } : task)),
  }));
}

export function applyOptimisticRemoval(
  queryClient: QueryClient,
  id: string,
): Promise<ListsSnapshot> {
  return updateCachedLists(queryClient, (page) => {
    const items = page.items.filter((task) => task.id !== id);
    const wasRemoved = items.length < page.items.length;
    const meta = wasRemoved ? { ...page.meta, total: page.meta.total - 1 } : page.meta;
    return { items, meta };
  });
}

export function restoreLists(queryClient: QueryClient, snapshot: ListsSnapshot): void {
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
}
