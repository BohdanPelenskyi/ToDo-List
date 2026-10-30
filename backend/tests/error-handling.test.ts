import request from 'supertest';
import { createApp } from '../src/app';
import { useCleanDatabase } from './support/database-lifecycle';

useCleanDatabase();

describe('error handling', () => {
  it('responds with a NOT_FOUND error for unknown routes', async () => {
    const response = await request(createApp()).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/unknown not found' },
    });
  });

  it('responds with a BAD_REQUEST error for malformed JSON', async () => {
    const response = await request(createApp())
      .post('/api/anything')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Request body is not valid JSON' },
    });
  });

  it('responds with PAYLOAD_TOO_LARGE for oversized bodies', async () => {
    const response = await request(createApp())
      .post('/api/anything')
      .send({ text: 'x'.repeat(20_000) });

    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });
});
