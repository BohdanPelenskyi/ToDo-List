import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { env } from '../../src/config/env';
import { errorHandler } from '../../src/middlewares/error-handler';

jest.mock('../../src/config/env', () => ({ env: { NODE_ENV: 'test' } }));

function createAppThatThrows(error: unknown) {
  const app = express();
  app.use(pinoHttp({ logger: pino({ level: 'silent' }) }));
  app.get('/boom', () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler for unexpected errors', () => {
  it('exposes the message and stack outside production to ease debugging', async () => {
    env.NODE_ENV = 'development';

    const response = await request(createAppThatThrows(new Error('db exploded'))).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'db exploded',
        details: expect.any(String) as string,
      },
    });
  });

  it('hides the message and stack in production', async () => {
    env.NODE_ENV = 'production';

    const response = await request(createAppThatThrows(new Error('db exploded'))).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });

  it('handles thrown values that are not Error instances', async () => {
    env.NODE_ENV = 'production';

    const response = await request(createAppThatThrows('just a string')).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ error: { message: 'Internal server error' } });
  });
});
