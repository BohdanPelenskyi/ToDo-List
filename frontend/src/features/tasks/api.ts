import { apiClient } from '@/lib/api-client';
import type { CreateTaskInput, Paginated, Task, TaskFilters, UpdateTaskInput } from '@/types/api';

export const tasksApi = {
  list: (filters: TaskFilters, signal?: AbortSignal) =>
    apiClient.get<Paginated<Task>>('/tasks', { query: { ...filters }, signal }),
  create: (input: CreateTaskInput) => apiClient.post<Task>('/tasks', input),
  update: (id: string, changes: UpdateTaskInput) => apiClient.patch<Task>(`/tasks/${id}`, changes),
  remove: (id: string) => apiClient.delete(`/tasks/${id}`),
};
