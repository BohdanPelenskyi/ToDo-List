import type { Request, Response } from 'express';
import { getAuthenticatedUserId } from '../../middlewares/require-auth';
import { getValidated } from '../../middlewares/validate';
import { serializeTask } from './task.serializer';
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema,
} from './tasks.schemas';
import * as tasksService from './tasks.service';

export async function list(req: Request, res: Response): Promise<void> {
  const query = getValidated(req, 'query', listTasksQuerySchema);
  const { items, meta } = await tasksService.listTasks(getAuthenticatedUserId(req), query);

  res.json({ items: items.map(serializeTask), meta });
}

export async function get(req: Request, res: Response): Promise<void> {
  const { id } = getValidated(req, 'params', taskIdParamsSchema);
  const task = await tasksService.getTask(getAuthenticatedUserId(req), id);

  res.json(serializeTask(task));
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = getValidated(req, 'body', createTaskSchema);
  const task = await tasksService.createTask(getAuthenticatedUserId(req), input);

  res.status(201).json(serializeTask(task));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = getValidated(req, 'params', taskIdParamsSchema);
  const changes = getValidated(req, 'body', updateTaskSchema);
  const task = await tasksService.updateTask(getAuthenticatedUserId(req), id, changes);

  res.json(serializeTask(task));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = getValidated(req, 'params', taskIdParamsSchema);
  await tasksService.deleteTask(getAuthenticatedUserId(req), id);

  res.status(204).end();
}
