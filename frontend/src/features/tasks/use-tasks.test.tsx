import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { tasksKeys } from '@/lib/query-keys';
import type { Paginated, Task } from '@/types/api';
import { useDeleteTask, useTasks, useUpdateTask } from './use-tasks';
import { jsonResponse } from '@/test-utils';

const fetchMock = vi.fn<typeof fetch>();

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Write tests',
    description: null,
    status: 'todo',
    dueAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makePage(items: Task[]): Paginated<Task> {
  return { items, meta: { page: 1, limit: 20, total: items.length, totalPages: 1 } };
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function cachedItems(queryClient: QueryClient, filters = {}): Task[] | undefined {
  return queryClient.getQueryData<Paginated<Task>>(tasksKeys.list(filters))?.items;
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('useTasks', () => {
  it('requests the list with the given filters', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makePage([makeTask()])));
    const { wrapper } = setup();

    const { result } = renderHook(() => useTasks({ status: 'done', page: 2 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/tasks?status=done&page=2');
    expect(result.current.data?.items).toHaveLength(1);
  });
});

describe('useUpdateTask', () => {
  it('updates the cached list immediately, before the server responds', async () => {
    let respond: (response: Response) => void = () => undefined;
    fetchMock.mockReturnValue(new Promise((resolve) => (respond = resolve)));
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(tasksKeys.list({}), makePage([makeTask()]));
    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    act(() => {
      result.current.mutate({ id: 'task-1', changes: { status: 'done' } });
    });

    await waitFor(() => {
      expect(cachedItems(queryClient)?.[0]?.status).toBe('done');
    });
    expect(result.current.isPending).toBe(true);
    respond(jsonResponse(makeTask({ status: 'done' })));
  });

  it('rolls the cache back when the request fails', async () => {
    fetchMock.mockImplementation((_input, init) =>
      Promise.resolve(
        init?.method === 'PATCH'
          ? jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }, 500)
          : jsonResponse(makePage([makeTask()])),
      ),
    );
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(tasksKeys.list({}), makePage([makeTask()]));
    const { result } = renderHook(() => useUpdateTask(), { wrapper });

    act(() => {
      result.current.mutate({ id: 'task-1', changes: { status: 'done' } });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(cachedItems(queryClient)?.[0]?.status).toBe('todo');
  });
});

describe('useDeleteTask', () => {
  it('removes the task from the cached list and decrements the total immediately', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(
      tasksKeys.list({}),
      makePage([makeTask(), makeTask({ id: 'task-2', title: 'Other' })]),
    );
    const { result } = renderHook(() => useDeleteTask(), { wrapper });

    act(() => {
      result.current.mutate('task-1');
    });

    await waitFor(() => {
      expect(cachedItems(queryClient)?.map((task) => task.id)).toEqual(['task-2']);
    });
    expect(queryClient.getQueryData<Paginated<Task>>(tasksKeys.list({}))?.meta.total).toBe(1);
  });

  it('restores the removed task when the request fails', async () => {
    fetchMock.mockImplementation((_input, init) =>
      Promise.resolve(
        init?.method === 'DELETE'
          ? jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'boom' } }, 500)
          : jsonResponse(makePage([makeTask()])),
      ),
    );
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(tasksKeys.list({}), makePage([makeTask()]));
    const { result } = renderHook(() => useDeleteTask(), { wrapper });

    act(() => {
      result.current.mutate('task-1');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(cachedItems(queryClient)?.map((task) => task.id)).toEqual(['task-1']);
  });
});
