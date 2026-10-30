import request from 'supertest';
import { createApp } from '../src/app';
import { useCleanDatabase } from './support/database-lifecycle';

const RATE_LIMIT = 3;

// jest.mock is hoisted above the imports, so the limit is a literal here rather than RATE_LIMIT.
jest.mock('../src/config/env', () => {
  const actual = jest.requireActual<{ env: object }>('../src/config/env');
  return { env: { ...actual.env, AUTH_RATE_LIMIT_MAX: 3 } };
});

useCleanDatabase();

describe('auth rate limiting', () => {
  it('responds with 429 after too many login attempts', async () => {
    const app = createApp();
    const attempt = () =>
      request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'x' });
    for (let i = 0; i < RATE_LIMIT; i++) {
      await attempt();
    }

    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ error: { code: 'TOO_MANY_REQUESTS' } });
  });
});
