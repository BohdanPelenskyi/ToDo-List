import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from './tasks.schemas';
import * as tasksController from './tasks.controller';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get('/', validate(listTasksQuerySchema, 'query'), asyncHandler(tasksController.list));
tasksRouter.post('/', validate(createTaskSchema, 'body'), asyncHandler(tasksController.create));
tasksRouter.get('/:id', validate(taskIdParamsSchema, 'params'), asyncHandler(tasksController.get));
tasksRouter.patch(
  '/:id',
  validate(taskIdParamsSchema, 'params'),
  validate(updateTaskSchema, 'body'),
  asyncHandler(tasksController.update),
);
tasksRouter.delete(
  '/:id',
  validate(taskIdParamsSchema, 'params'),
  asyncHandler(tasksController.remove),
);
