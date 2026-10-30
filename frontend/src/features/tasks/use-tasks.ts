import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksKeys } from '@/lib/query-keys';
import type { TaskFilters, UpdateTaskInput } from '@/types/api';
import { tasksApi } from './api';
import {
  applyOptimisticRemoval,
  applyOptimisticUpdate,
  restoreLists,
  type ListsSnapshot,
} from './optimistic-cache';

interface OptimisticContext {
  snapshot: ListsSnapshot;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: tasksKeys.list(filters),
    queryFn: ({ signal }) => tasksApi.list(filters, signal),
    // Keeps the current page on screen while the next filter or page loads.
    placeholderData: keepPreviousData,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKeys.lists() }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; changes: UpdateTaskInput }, OptimisticContext>({
    mutationFn: ({ id, changes }) => tasksApi.update(id, changes),
    onMutate: async ({ id, changes }) => ({
      snapshot: await applyOptimisticUpdate(queryClient, id, changes),
    }),
    onError: (_error, _variables, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
    },
    // Runs on success and failure, so the cache always ends up matching the server.
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKeys.all }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string, OptimisticContext>({
    mutationFn: tasksApi.remove,
    onMutate: async (id) => ({ snapshot: await applyOptimisticRemoval(queryClient, id) }),
    onError: (_error, _id, context) => {
      if (context) restoreLists(queryClient, context.snapshot);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksKeys.all }),
  });
}
