import { z } from 'zod';
import { TASK_STATUSES } from '../../models';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'status', 'dueAt'] as const;

// An absolute moment such as "2026-11-05T14:30:00.000Z" or "...+02:00"; local times are rejected
// because the server cannot know which time zone they mean.
const dateTimeSchema = z.iso.datetime({ offset: true });

const taskFields = {
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).nullable(),
  status: z.enum(TASK_STATUSES),
  dueAt: dateTimeSchema.nullable(),
};

export const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.optional(),
  dueAt: taskFields.dueAt.optional(),
});

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .refine((fields) => Object.keys(fields).length > 0, {
    message: 'At least one field must be provided',
  });

export const listTasksQuerySchema = z
  .object({
    status: taskFields.status.optional(),
    dueFrom: dateTimeSchema.optional(),
    dueTo: dateTimeSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    sort: z.enum(TASK_SORT_FIELDS).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(({ dueFrom, dueTo }) => !dueFrom || !dueTo || new Date(dueFrom) <= new Date(dueTo), {
    message: 'dueFrom must not be after dueTo',
    path: ['dueFrom'],
  });

export const taskIdParamsSchema = z.object({
  id: z.uuid(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
