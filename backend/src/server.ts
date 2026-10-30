import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { sequelize } from './db/sequelize';

async function start(): Promise<void> {
  await sequelize.authenticate();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on port ${String(env.PORT)}`);
  });

  // Docker sends SIGTERM on stop; draining requests before closing the pool avoids dropped queries.
  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      sequelize
        .close()
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          logger.error({ err: error }, 'Failed to close the database connection');
          process.exit(1);
        });
    });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });
}

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start the server');
  process.exit(1);
});
