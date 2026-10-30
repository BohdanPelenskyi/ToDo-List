// @vitest-environment node
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function run(
  path: string,
  { withSession, headers = {} }: { withSession: boolean; headers?: Record<string, string> },
) {
  const cookie: Record<string, string> = withSession ? { cookie: 'access_token=any-token' } : {};
  return middleware(
    new NextRequest(`http://localhost:3000${path}`, { headers: { ...cookie, ...headers } }),
  );
}

describe('middleware', () => {
  it.each(['/tasks', '/tasks/123'])('redirects %s to /login without a session', (path) => {
    const response = run(path, { withSession: false });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it.each(['/login', '/register'])('redirects %s to /tasks with a session', (path) => {
    const response = run(path, { withSession: true });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/tasks');
  });

  it('redirects to the host and protocol the browser used, not the internal address', () => {
    const response = run('/tasks', {
      withSession: false,
      headers: {
        host: 'internal:3000',
        'x-forwarded-host': 'todo.example.com',
        'x-forwarded-proto': 'https',
      },
    });

    expect(response.headers.get('location')).toBe('https://todo.example.com/login');
  });

  it.each([
    ['/tasks', true],
    ['/login', false],
    ['/register', false],
  ])('lets %s through when the session state matches (session: %s)', (path, withSession) => {
    const response = run(path, { withSession });

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
