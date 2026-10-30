// Used by sequelize-cli only; the application builds its own connection in src/db/sequelize.ts.
const dialect = 'postgres';

module.exports = {
  development: { dialect, use_env_variable: 'DATABASE_URL' },
  test: { dialect, use_env_variable: 'TEST_DATABASE_URL' },
  production: { dialect, use_env_variable: 'DATABASE_URL' },
};
