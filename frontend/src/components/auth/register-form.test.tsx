import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { errorResponse, jsonResponse, renderWithQueryClient } from '@/test-utils';
import { RegisterForm } from './register-form';

const replaceMock = vi.fn();
const fetchMock = vi.fn<typeof fetch>();

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: replaceMock }) }));

const user = {
  id: 'user-1',
  email: 'new@example.com',
  name: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function fillAndSubmit({ name = '', email = '', password = '' }) {
  const events = userEvent.setup();
  if (name) await events.type(screen.getByLabelText('Name (optional)'), name);
  if (email) await events.type(screen.getByLabelText('Email'), email);
  if (password) await events.type(screen.getByLabelText('Password'), password);
  await events.click(screen.getByRole('button', { name: 'Create account' }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  replaceMock.mockReset();
});

describe('RegisterForm', () => {
  it('describes the password rules for assistive technology', () => {
    renderWithQueryClient(<RegisterForm />);

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'At least 8 characters, with a letter and a digit.',
    );
  });

  it.each([
    ['too short', 'Pass1', 'Password must be at least 8 characters'],
    ['without a digit', 'PasswordOnly', 'Password must contain at least one digit'],
    ['without a letter', '12345678', 'Password must contain at least one letter'],
  ])('rejects a password that is %s', async (_label, password, message) => {
    renderWithQueryClient(<RegisterForm />);

    await fillAndSubmit({ email: 'new@example.com', password });

    const field = screen.getByLabelText('Password');
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(expect.stringContaining(message));
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('focuses the first invalid field when several are wrong', async () => {
    renderWithQueryClient(<RegisterForm />);

    await fillAndSubmit({ name: 'x'.repeat(101) });

    await waitFor(() => {
      expect(screen.getByLabelText('Name (optional)')).toHaveFocus();
    });
  });

  it('registers, omits an empty name and redirects to /tasks', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user }, 201));
    renderWithQueryClient(<RegisterForm />);

    await fillAndSubmit({ email: 'New@Example.com', password: 'Password123' });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/tasks');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        body: JSON.stringify({ email: 'new@example.com', password: 'Password123' }),
      }),
    );
  });

  it('sends the name when provided', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user }, 201));
    renderWithQueryClient(<RegisterForm />);

    await fillAndSubmit({ name: ' Alice ', email: 'new@example.com', password: 'Password123' });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'Password123',
            name: 'Alice',
          }),
        }),
      );
    });
  });

  it('explains that the email is already registered', async () => {
    fetchMock.mockResolvedValue(errorResponse(409, 'CONFLICT', 'A user with this email exists'));
    renderWithQueryClient(<RegisterForm />);

    await fillAndSubmit({ email: 'taken@example.com', password: 'Password123' });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Try signing in instead.',
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('disables the button while the request is in flight', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    renderWithQueryClient(<RegisterForm />);

    await fillAndSubmit({ email: 'new@example.com', password: 'Password123' });

    const button = await screen.findByRole('button', { name: 'Creating account…' });
    expect(button).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
