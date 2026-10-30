import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './support/test-database-url';

// Applies the real migrations so the tests run against the same schema as production.
export default function globalSetup(): void {
  execSync('npx sequelize-cli db:migrate --env test', {
    stdio: 'inherit',
    env: { ...process.env, TEST_DATABASE_URL },
  });
}
