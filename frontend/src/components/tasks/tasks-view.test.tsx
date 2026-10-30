import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithQueryClient } from '@/test-utils';
import type { Paginated, Task } from '@/types/api';
import { TasksView } from './tasks-view';

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
    description: 'Cover the API',
    status: 'in_progress',
    dueAt: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

function page(items: Task[], meta: Partial<Paginated<Task>['meta']> = {}): Paginated<Task> {
  return { items, meta: { page: 1, limit: 10, total: items.length, totalPages: 1, ...meta } };
}

function apiError(status: number, code: string) {
  return HttpResponse.json({ error: { code, message: 'Something failed' } }, { status });
}

// Every test needs the current user for the header; the task list is what varies.
function mockApi(
  tasksResponse: () => Response | Promise<Response> = () => HttpResponse.json(page([makeTask()])),
) {
  server.use(
    http.get('*/api/auth/me', () => HttpResponse.json({ user })),
    http.get('*/api/tasks', () => tasksResponse()),
  );
}

async function renderLoaded() {
  renderWithQueryClient(<TasksView />);
  await screen.findByRole('list', { name: 'Tasks' });
}

beforeEach(() => {
  searchParams = new URLSearchParams();
});

afterEach(() => {
  replaceMock.mockReset();
});

describe('TasksView list', () => {
  it('shows a loading skeleton and then the tasks', async () => {
    mockApi();

    renderWithQueryClient(<TasksView />);

    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Tasks' });
    expect(within(list).getByRole('heading', { name: 'Write tests' })).toBeInTheDocument();
    expect(within(list).getByText('In progress', { selector: 'span' })).toBeInTheDocument();
    expect(within(list).getByText('Cover the API')).toBeInTheDocument();
    expect(within(list).getByText('Jan 1, 2026')).toBeInTheDocument();
  });

  it('shows who is signed in in the header', async () => {
    mockApi(() => HttpResponse.json(page([])));

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });

  it('requests the status and page found in the URL', async () => {
    searchParams = new URLSearchParams('status=done&page=2');
    let requestedUrl = '';
    server.use(
      http.get('*/api/auth/me', () => HttpResponse.json({ user })),
      http.get('*/api/tasks', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json(page([makeTask({ status: 'done' })], { page: 2, totalPages: 2 }));
      }),
    );

    await renderLoaded();

    expect(new URL(requestedUrl).search).toBe('?status=done&page=2&limit=10');
    expect(screen.getByRole('link', { name: 'Done' })).toHaveAttribute('aria-current', 'page');
  });

  it('links each filter to its own URL', async () => {
    mockApi();

    await renderLoaded();

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'To do' })).toHaveAttribute(
      'href',
      '/tasks?status=todo',
    );
    expect(screen.getByRole('link', { name: 'In progress' })).toHaveAttribute(
      'href',
      '/tasks?status=in_progress',
    );
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
  });

  it('paginates with links that keep the status filter', async () => {
    searchParams = new URLSearchParams('status=todo&page=2');
    mockApi(() =>
      HttpResponse.json(
        page([makeTask({ status: 'todo' })], { page: 2, totalPages: 3, total: 25 }),
      ),
    );

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'href',
      '/tasks?status=todo',
    );
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/tasks?status=todo&page=3',
    );
  });

  it('moves back to the last page when the URL points past the end', async () => {
    searchParams = new URLSearchParams('page=9');
    mockApi(() => HttpResponse.json(page([], { page: 9, total: 0, totalPages: 0 })));

    renderWithQueryClient(<TasksView />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/tasks');
    });
  });
});

describe('TasksView states', () => {
  it('invites the user to create a first task when there are none at all', async () => {
    mockApi(() => HttpResponse.json(page([])));

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByRole('heading', { name: 'No tasks yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create task' })).toBeInTheDocument();
  });

  it('explains that the filter matched nothing and offers to clear it', async () => {
    searchParams = new URLSearchParams('status=in_progress');
    mockApi(() => HttpResponse.json(page([])));

    renderWithQueryClient(<TasksView />);

    expect(
      await screen.findByRole('heading', { name: 'No tasks with status “In progress”' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Show all tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.queryByRole('heading', { name: 'No tasks yet' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry button that loads the tasks again', async () => {
    let attempts = 0;
    mockApi(() =>
      ++attempts === 1 ? apiError(500, 'INTERNAL_ERROR') : HttpResponse.json(page([makeTask()])),
    );

    renderWithQueryClient(<TasksView />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your tasks');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Write tests' })).toBeInTheDocument();
  });
});

describe('TasksView create', () => {
  it('creates a task from the dialog and confirms with a toast', async () => {
    let sentBody: unknown;
    mockApi();
    server.use(
      http.post('*/api/tasks', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(makeTask({ id: 'new' }), { status: 201 });
      }),
    );
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    expect(within(dialog).getByLabelText('Title')).toHaveFocus();
    await events.type(within(dialog).getByLabelText('Title'), '  Buy milk ');
    await events.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(await screen.findByText('Task created.')).toBeInTheDocument();
    expect(sentBody).toEqual({ title: 'Buy milk', description: null, status: 'todo', dueAt: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the create dialog from the floating button used on phones', async () => {
    mockApi();
    await renderLoaded();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Add task' }));

    expect(screen.getByRole('dialog', { name: 'New task' })).toBeInTheDocument();
  });

  it('validates the form before sending anything', async () => {
    const onRequest = vi.fn();
    mockApi();
    server.use(
      http.post('*/api/tasks', () => {
        onRequest();
        return HttpResponse.json(makeTask(), { status: 201 });
      }),
    );
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    await events.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(await within(dialog).findByText('Title is required')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and reports the failure when creating fails', async () => {
    mockApi();
    server.use(http.post('*/api/tasks', () => apiError(500, 'INTERNAL_ERROR')));
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    await events.type(within(dialog).getByLabelText('Title'), 'Buy milk');
    await events.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(
      await screen.findByText('Could not create the task. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'New task' })).toBeInTheDocument();
  });

  it('cancels without sending anything', async () => {
    const onRequest = vi.fn();
    mockApi();
    server.use(
      http.post('*/api/tasks', () => {
        onRequest();
        return HttpResponse.json(makeTask(), { status: 201 });
      }),
    );
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'New task' }));
    await events.click(
      within(screen.getByRole('dialog', { name: 'New task' })).getByRole('button', {
        name: 'Cancel',
      }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onRequest).not.toHaveBeenCalled();
  });
});

describe('TasksView edit, status and delete', () => {
  it('edits a task in a pre-filled dialog', async () => {
    let sentBody: unknown;
    mockApi();
    server.use(
      http.patch('*/api/tasks/task-1', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(makeTask({ title: 'Write more tests' }));
      }),
    );
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'Edit Write tests' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit task' });
    const title = within(dialog).getByLabelText('Title');
    expect(title).toHaveValue('Write tests');
    expect(within(dialog).getByLabelText('Description (optional)')).toHaveValue('Cover the API');
    expect(within(dialog).getByLabelText('Status')).toHaveValue('in_progress');
    await events.clear(title);
    await events.type(title, 'Write more tests');
    await events.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Task updated.')).toBeInTheDocument();
    expect(sentBody).toEqual({
      title: 'Write more tests',
      description: 'Cover the API',
      status: 'in_progress',
      dueAt: null,
    });
  });

  it('changes the status straight from the card', async () => {
    let sentBody: unknown;
    mockApi();
    server.use(
      http.patch('*/api/tasks/task-1', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(makeTask({ status: 'done' }));
      }),
    );
    await renderLoaded();

    await userEvent.setup().selectOptions(screen.getByLabelText('Status of Write tests'), 'Done');

    expect(await screen.findByText('Moved to “Done”.')).toBeInTheDocument();
    expect(sentBody).toEqual({ status: 'done' });
  });

  it('reverts the status and reports the failure when the change is rejected', async () => {
    mockApi();
    server.use(http.patch('*/api/tasks/task-1', () => apiError(500, 'INTERNAL_ERROR')));
    await renderLoaded();

    await userEvent.setup().selectOptions(screen.getByLabelText('Status of Write tests'), 'Done');

    expect(
      await screen.findByText('Could not change the status. Please try again.'),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Status of Write tests')).toHaveValue('in_progress');
    });
  });

  it('asks for confirmation before deleting and does nothing when cancelled', async () => {
    const onRequest = vi.fn();
    mockApi();
    server.use(
      http.delete('*/api/tasks/task-1', () => {
        onRequest();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'Delete Write tests' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete task?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(
      within(dialog).getByText(/“Write tests” will be permanently deleted/),
    ).toBeInTheDocument();
    await events.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('deletes the task after confirmation and shows a toast', async () => {
    const onRequest = vi.fn();
    mockApi();
    server.use(
      http.delete('*/api/tasks/task-1', () => {
        onRequest();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const events = userEvent.setup();
    await renderLoaded();

    await events.click(screen.getByRole('button', { name: 'Delete Write tests' }));
    await events.click(
      within(screen.getByRole('dialog', { name: 'Delete task?' })).getByRole('button', {
        name: 'Delete',
      }),
    );

    expect(await screen.findByText('Task deleted.')).toBeInTheDocument();
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('signs out and goes to the login page', async () => {
    mockApi();
    server.use(http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })));
    await renderLoaded();
    await screen.findByText('Alice');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
