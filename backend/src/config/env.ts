import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters long'),
  // A duration such as "15m", "12h" or "7d"; the template type is what jsonwebtoken accepts.
  JWT_EXPIRES_IN: z
    .templateLiteral([z.number().int().positive(), z.enum(['s', 'm', 'h', 'd'])])
    .default('7d'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  // Number of reverse proxies in front of the API, so rate limiting sees the real client IP.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  // Defaults to true in production. Set to false only when serving over plain HTTP (local Docker).
  COOKIE_SECURE: z.stringbool().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
}

export const env = result.data;
