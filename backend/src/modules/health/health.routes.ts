import { Router } from 'express';
import { sequelize } from '../../db/sequelize';
import { AppError } from '../../utils/app-error';
import { asyncHandler } from '../../utils/async-handler';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      await sequelize.authenticate();
    } catch {
      throw AppError.serviceUnavailable('Database is unreachable');
    }
    res.json({ status: 'ok' });
  }),
);
