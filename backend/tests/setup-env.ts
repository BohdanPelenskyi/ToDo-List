import { TEST_DATABASE_URL } from './support/test-database-url';

// Runs before any module is imported, so `config/env.ts` validates the test configuration.
// backend/.env may have been loaded by the import above; every setting the tests depend on is
// therefore assigned explicitly instead of trusting whatever the developer's .env contains.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.TRUST_PROXY_HOPS = '0';
delete process.env.COOKIE_SECURE;
