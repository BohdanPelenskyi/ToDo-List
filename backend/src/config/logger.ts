import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: { paths: ['req.headers.cookie', 'req.headers.authorization'], remove: true },
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});
