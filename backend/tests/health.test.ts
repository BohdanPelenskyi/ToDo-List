import request from 'supertest';
import { createApp } from '../src/app';
import { useCleanDatabase } from './support/database-lifecycle';

useCleanDatabase();

describe('GET /api/health', () => {
  it('responds with status ok when the database is reachable', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
