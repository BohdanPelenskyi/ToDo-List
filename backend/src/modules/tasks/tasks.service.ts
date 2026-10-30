import { Op, type InferAttributes, type WhereOptions } from 'sequelize';
import { Task } from '../../models';
import { AppError } from '../../utils/app-error';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './tasks.schemas';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskPage {
  items: Task[];
  meta: PaginationMeta;
}

// The API exchanges ISO strings; the model stores Dates. `undefined` means "leave unchanged".
function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(value);
}

function dueAtRange(dueFrom: string | undefined, dueTo: string | undefined) {
  return {
    ...(dueFrom ? { [Op.gte]: new Date(dueFrom) } : {}),
    ...(dueTo ? { [Op.lte]: new Date(dueTo) } : {}),
  };
}

export async function listTasks(
  userId: string,
  { status, dueFrom, dueTo, page, limit, sort, order }: ListTasksQuery,
): Promise<TaskPage> {
  const hasDueRange = dueFrom !== undefined || dueTo !== undefined;
  const where: WhereOptions<InferAttributes<Task>> = {
    userId,
    ...(status ? { status } : {}),
    ...(hasDueRange ? { dueAt: dueAtRange(dueFrom, dueTo) } : {}),
  };

  // Tasks without a due date are always listed last, whichever way the dates are sorted.
  const direction = sort === 'dueAt' ? `${order.toUpperCase()} NULLS LAST` : order.toUpperCase();

  const { rows, count } = await Task.findAndCountAll({
    where,
    // The id tiebreaker keeps page boundaries stable when sort values repeat.
    order: [
      [sort, direction],
      ['id', 'ASC'],
    ],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    items: rows,
    meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
}

// Every lookup is scoped by userId: a foreign task is reported as missing, never as forbidden.
export async function getTask(userId: string, id: string): Promise<Task> {
  const task = await Task.findOne({ where: { id, userId } });
  if (!task) {
    throw AppError.notFound('Task not found');
  }
  return task;
}

export async function createTask(
  userId: string,
  { title, description, status, dueAt }: CreateTaskInput,
): Promise<Task> {
  return Task.create({
    userId,
    title,
    description: description ?? null,
    status,
    dueAt: toDate(dueAt) ?? null,
  });
}

export async function updateTask(
  userId: string,
  id: string,
  { dueAt, ...changes }: UpdateTaskInput,
): Promise<Task> {
  const task = await getTask(userId, id);
  const parsedDueAt = toDate(dueAt);
  return task.update({ ...changes, ...(parsedDueAt !== undefined ? { dueAt: parsedDueAt } : {}) });
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  const task = await getTask(userId, id);
  await task.destroy();
}
