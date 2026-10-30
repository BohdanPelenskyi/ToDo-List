import { z } from 'zod';
import { TASK_STATUSES } from '@/types/api';
import { fromLocalInputValue, isValidLocalInput } from '@/lib/datetime';

// These rules mirror backend/src/modules/tasks/tasks.schemas.ts.
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(MAX_TITLE_LENGTH, `Title must be at most ${String(MAX_TITLE_LENGTH)} characters`),
  // A cleared textarea means "no description", which the API stores as null.
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${String(MAX_DESCRIPTION_LENGTH)} characters`,
    )
    .transform((description) => description.trim() || null),
  status: z.enum(TASK_STATUSES),
  // The input yields local wall-clock time (or ''); the API gets an absolute ISO moment or null.
  dueAt: z
    .string()
    .refine(isValidLocalInput, 'Enter a valid date and time')
    .transform(fromLocalInputValue),
});

export type TaskFormValues = z.input<typeof taskFormSchema>;
export type TaskFormData = z.output<typeof taskFormSchema>;
