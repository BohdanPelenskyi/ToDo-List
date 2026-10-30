import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderWithQueryClient } from '@/test-utils';
import { LoginForm } from './login-form';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: replaceMock }) }));

const user = {
  id: 'user-1',
  email: 'alice@example.com',
  name: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function fillAndSubmit(email: string, password: string) {
  const events = userEvent.setup();
  await events.type(screen.getByLabelText('Email'), email);
  await events.type(screen.getByLabelText('Password'), password);
  await events.click(screen.getByRole('button', { name: 'Sign in' }));
}

afterEach(() => {
  replaceMock.mockReset();
});

describe('LoginForm', () => {
  it('shows an error under each invalid field and focuses the first one', async () => {
    renderWithQueryClient(<LoginForm />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));

    const email = screen.getByLabelText('Email');
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Email is required');
    await waitFor(() => {
      expect(email).toHaveFocus();
    });
  });

  it('rejects a malformed email before calling the API', async () => {
    const onRequest = vi.fn();
    server.use(
      http.post('*/api/auth/login', () => {
        onRequest();
        return HttpResponse.json({ user });
      }),
    );
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit('not-an-email', 'Password123');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('signs in with a normalized email and redirects to /tasks', async () => {
    let sentBody: unknown;
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ user });
      }),
    );
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit('  Alice@Example.COM ', 'Password123');

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/tasks');
    });
    expect(sentBody).toEqual({ email: 'alice@example.com', password: 'Password123' });
  });

  it('explains wrong credentials above the form without redirecting', async () => {
    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit('alice@example.com', 'WrongPassword1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(replaceMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('shows a network-level message when the server cannot be reached', async () => {
    server.use(http.post('*/api/auth/login', () => HttpResponse.error()));
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit('alice@example.com', 'Password123');

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server');
  });

  it('disables the button while signing in so a double click sends one request', async () => {
    let requests = 0;
    server.use(
      http.post('*/api/auth/login', async () => {
        requests++;
        await new Promise(() => undefined);
        return HttpResponse.json({ user });
      }),
    );
    renderWithQueryClient(<LoginForm />);

    await fillAndSubmit('alice@example.com', 'Password123');
    const button = await screen.findByRole('button', { name: 'Signing in…' });
    await userEvent.setup().dblClick(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(requests).toBe(1);
  });
});
