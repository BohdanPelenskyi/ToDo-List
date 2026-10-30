import type { Express } from 'express';
import request from 'supertest';

export const DEFAULT_PASSWORD = 'Password123';

export type TestAgent = ReturnType<typeof request.agent>;

export interface TestUser {
  id: string;
  email: string;
  /** Keeps the session cookie between requests. */
  agent: TestAgent;
}

export async function createAuthenticatedUser(app: Express, email: string): Promise<TestUser> {
  const agent = request.agent(app);
  const response = await agent
    .post('/api/auth/register')
    .send({ email, password: DEFAULT_PASSWORD });

  return { id: (response.body as { user: { id: string } }).user.id, email, agent };
}

export function findSetCookie(response: request.Response, name: string): string | undefined {
  const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((cookie) => cookie.startsWith(`${name}=`));
}
