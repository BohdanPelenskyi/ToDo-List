import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';
import { handleUnauthorized, shouldRetry } from './query-client';

const fetchMock = vi.fn<typeof fetch>();
const assignMock = vi.fn();

function setPathname(pathname: string): void {
  vi.stubGlobal('location', { pathname, assign: assignMock });
}

beforeEach(() => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  assignMock.mockReset();
});

describe('shouldRetry', () => {
  it.each([400, 401, 404, 409])('does not retry a %i response', (status) => {
    const error = new ApiError(status, 'ANY', 'message');

    expect(shouldRetry(0, error)).toBe(false);
  });

  it.each([
    ['a server error', new ApiError(500, 'INTERNAL_ERROR', 'boom')],
    ['a network failure', new ApiError(0, 'NETWORK_ERROR', 'offline')],
    ['an unexpected error', new Error('boom')],
  ])('retries %s a limited number of times', (_label, error) => {
    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });
});

describe('handleUnauthorized', () => {
  it('clears the session cookie, empties the cache and redirects to /login on a 401', async () => {
    setPathname('/tasks');
    const queryClient = new QueryClient();
    queryClient.setQueryData(['tasks'], { items: [] });

    handleUnauthorized(queryClient, new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));

    await vi.waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/login');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(queryClient.getQueryData(['tasks'])).toBeUndefined();
  });

  it('still redirects when the logout request fails', async () => {
    setPathname('/tasks');
    fetchMock.mockRejectedValue(new TypeError('offline'));

    handleUnauthorized(new QueryClient(), new ApiError(401, 'UNAUTHORIZED', 'expired'));

    await vi.waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/login');
    });
  });

  it('ignores a 401 on the login page, where it means wrong credentials', () => {
    setPathname('/login');

    handleUnauthorized(
      new QueryClient(),
      new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password'),
    );

    expect(assignMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([new ApiError(404, 'NOT_FOUND', 'missing'), new Error('boom')])(
    'ignores errors that are not a 401',
    (error) => {
      setPathname('/tasks');

      handleUnauthorized(new QueryClient(), error);

      expect(assignMock).not.toHaveBeenCalled();
    },
  );
});
