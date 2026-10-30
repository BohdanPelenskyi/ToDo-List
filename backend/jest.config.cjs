/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  // Suites share one database, so they must not run in parallel.
  maxWorkers: 1,
  // Hashing a password with bcrypt cost 12 can take over 5 seconds on a busy machine.
  testTimeout: 20000,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
};
