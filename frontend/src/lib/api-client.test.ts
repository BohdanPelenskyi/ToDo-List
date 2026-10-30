import { ApiError, apiClient } from './api-client';
import { jsonResponse } from '@/test-utils';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('apiClient', () => {
  it('sends cookies and prefixes the path with /api', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.get('/tasks');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('serializes query params and skips undefined values', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await apiClient.get('/tasks', { query: { status: 'done', page: 2, limit: undefined } });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/tasks?status=done&page=2');
  });

  it('sends a JSON body with the matching content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 201));

    await apiClient.post('/tasks', { title: 'Write tests' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Write tests' }),
      }),
    );
  });

  it('returns the parsed JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: '1' }));

    const result = await apiClient.get<{ id: string }>('/tasks/1');

    expect(result).toEqual({ id: '1' });
  });

  it('resolves to undefined for a 204 response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const act = apiClient.delete('/tasks/1');

    await expect(act).resolves.toBeUndefined();
  });

  it('turns the contract error format into an ApiError', async () => {
    const details = { fieldErrors: { title: ['Required'] } };
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } },
        400,
      ),
    );

    const act = apiClient.post('/tasks', {});

    await expect(act).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    });
    await expect(act).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic ApiError when the error body is not in the contract format', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

    const act = apiClient.get('/tasks');

    await expect(act).rejects.toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
  });

  it('reports network failures as an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const act = apiClient.get('/tasks');

    await expect(act).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
