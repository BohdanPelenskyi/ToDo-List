import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithQueryClient } from '@/test-utils';
import type { Paginated, Task } from '@/types/api';
import { TasksView } from './tasks-view';

// Covers what scheduling adds to the page: due dates, the board and the calendar.

const replaceMock = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
}));

const user = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  createdAt: '2026-01-01T12:00:00.000Z',
};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Write tests',
    description: null,
    status: 'todo',
    dueAt: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

function page(items: Task[], meta: Partial<Paginated<Task>['meta']> = {}): Paginated<Task> {
  return { items, meta: { page: 1, limit: 100, total: items.length, totalPages: 1, ...meta } };
}

function mockApi(tasks: Task[], meta: Partial<Paginated<Task>['meta']> = {}) {
  server.use(
    http.get('*/api/auth/me', () => HttpResponse.json({ user })),
    http.get('*/api/tasks', () => HttpResponse.json(page(tasks, meta))),
  );
}

const nov5 = (hour: number) => new Date(2026, 10, 5, hour, 0).toISOString();

beforeEach(() => {
  searchParams = new URLSearchParams();
});

afterEach(() => {
  replaceMock.mockReset();
});

describe('due dates in the list', () => {
  it('shows when a task is due and flags it as overdue', async () => {
    mockApi([makeTask({ dueAt: new Date(2020, 0, 2, 9, 0).toISOString() })]);

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByText(/Due/)).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('does not flag a finished task as overdue', async () => {
    mockApi([makeTask({ dueAt: new Date(2020, 0, 2, 9, 0).toISOString(), status: 'done' })]);

    renderWithQueryClient(<TasksView />);

    await screen.findByText(/Due/);
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('sends the chosen date and time as an absolute moment', async () => {
    let sentBody: { dueAt?: string | null } = {};
    mockApi([makeTask()]);
    server.use(
      http.post('*/api/tasks', async ({ request }) => {
        sentBody = (await request.json()) as typeof sentBody;
        return HttpResponse.json(makeTask({ id: 'new' }), { status: 201 });
      }),
    );
    const events = userEvent.setup();
    renderWithQueryClient(<TasksView />);
    await screen.findByRole('list', { name: 'Tasks' });

    await events.click(screen.getByRole('button', { name: 'Add task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    await events.type(within(dialog).getByLabelText('Title'), 'Call the client');
    fireEvent.change(within(dialog).getByLabelText('Due date and time (optional)'), {
      target: { value: '2026-11-05T14:30' },
    });
    await events.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await screen.findByText('Task created.');
    expect(sentBody.dueAt).toBe(new Date(2026, 10, 5, 14, 30).toISOString());
  });

  it('pre-fills the existing due date when editing', async () => {
    mockApi([makeTask({ dueAt: new Date(2026, 10, 5, 14, 30).toISOString() })]);
    renderWithQueryClient(<TasksView />);
    await screen.findByRole('list', { name: 'Tasks' });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Edit Write tests' }));

    const dialog = screen.getByRole('dialog', { name: 'Edit task' });
    expect(within(dialog).getByLabelText('Due date and time (optional)')).toHaveValue(
      '2026-11-05T14:30',
    );
  });
});

describe('board view', () => {
  const boardTasks = [
    makeTask({ id: 'a', title: 'Plan', status: 'todo' }),
    makeTask({ id: 'b', title: 'Build', status: 'in_progress' }),
    makeTask({ id: 'c', title: 'Ship', status: 'done' }),
    makeTask({ id: 'd', title: 'Test', status: 'done' }),
  ];

  beforeEach(() => {
    searchParams = new URLSearchParams('view=board');
  });

  it('shows one column per status with its tasks and a drag handle on every card', async () => {
    mockApi(boardTasks);

    renderWithQueryClient(<TasksView />);

    const done = await screen.findByRole('region', { name: 'Done, 2 tasks' });
    expect(within(done).getByText('Ship')).toBeInTheDocument();
    expect(within(done).getByText('Test')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'To do, 1 task' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'In progress, 1 task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Plan' })).toBeInTheDocument();
  });

  it('asks the API for the whole board in one request, ordered by due date', async () => {
    let requested = new URLSearchParams();
    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ user })),
      http.get('*/api/tasks', ({ request }) => {
        requested = new URL(request.url).searchParams;
        return HttpResponse.json(page(boardTasks));
      }),
    );

    renderWithQueryClient(<TasksView />);
    await screen.findByRole('region', { name: 'Done, 2 tasks' });

    expect(requested.get('limit')).toBe('100');
    expect(requested.get('sort')).toBe('dueAt');
    expect(requested.get('status')).toBeNull();
  });

  it('invites you to drop tasks into an empty column', async () => {
    mockApi([makeTask({ id: 'a', title: 'Plan', status: 'todo' })]);

    renderWithQueryClient(<TasksView />);

    const done = await screen.findByRole('region', { name: 'Done, 0 tasks' });
    expect(within(done).getByText('Drop tasks here')).toBeInTheDocument();
  });

  it('says when only part of the tasks is shown', async () => {
    mockApi(boardTasks, { total: 250 });

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByText('Showing the first 4 of 250 tasks.')).toBeInTheDocument();
  });
});

describe('calendar view', () => {
  beforeEach(() => {
    searchParams = new URLSearchParams('view=calendar&month=2026-11&day=2026-11-05');
  });

  it('shows the month, the selected day and the tasks scheduled for it', async () => {
    mockApi([
      makeTask({ id: 'a', title: 'Morning call', dueAt: nov5(9) }),
      makeTask({ id: 'b', title: 'Other day', dueAt: new Date(2026, 10, 12, 9, 0).toISOString() }),
    ]);

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByRole('heading', { name: 'November 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thursday, November 5' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Tasks' });
    expect(within(list).getByText('Morning call')).toBeInTheDocument();
    expect(within(list).queryByText('Other day')).not.toBeInTheDocument();
  });

  it('labels each day with its number of tasks and marks the selected one', async () => {
    mockApi([makeTask({ id: 'a', dueAt: nov5(9) }), makeTask({ id: 'b', dueAt: nov5(15) })]);

    renderWithQueryClient(<TasksView />);

    const selected = await screen.findByRole('link', {
      name: 'Thursday, November 5, 2 tasks, selected',
    });
    expect(selected).toHaveAttribute('href', '/tasks?view=calendar&month=2026-11&day=2026-11-05');
    expect(screen.getByRole('link', { name: 'Friday, November 6, 0 tasks' })).toBeInTheDocument();
  });

  it('moves between months through the URL', async () => {
    mockApi([]);

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByRole('link', { name: 'Previous month' })).toHaveAttribute(
      'href',
      '/tasks?view=calendar&month=2026-10',
    );
    expect(screen.getByRole('link', { name: 'Next month' })).toHaveAttribute(
      'href',
      '/tasks?view=calendar&month=2026-12',
    );
  });

  it('requests exactly the visible weeks, ordered by due date', async () => {
    let requested = new URLSearchParams();
    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ user })),
      http.get('*/api/tasks', ({ request }) => {
        requested = new URL(request.url).searchParams;
        return HttpResponse.json(page([]));
      }),
    );

    renderWithQueryClient(<TasksView />);
    await screen.findByText('Nothing is scheduled for this day.');

    expect(new Date(requested.get('dueFrom') ?? '')).toEqual(new Date(2026, 9, 26, 0, 0, 0, 0));
    expect(new Date(requested.get('dueTo') ?? '')).toEqual(new Date(2026, 11, 6, 23, 59, 59, 999));
    expect(requested.get('sort')).toBe('dueAt');
  });

  it('starts a new task on the selected day', async () => {
    mockApi([]);
    renderWithQueryClient(<TasksView />);
    await screen.findByText('Nothing is scheduled for this day.');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Add to this day' }));

    const dialog = screen.getByRole('dialog', { name: 'New task' });
    expect(within(dialog).getByLabelText('Due date and time (optional)')).toHaveValue(
      '2026-11-05T09:00',
    );
  });
});
