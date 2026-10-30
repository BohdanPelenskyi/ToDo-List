'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { taskFormSchema, type TaskFormData, type TaskFormValues } from '@/lib/schemas/task';
import { TASK_STATUS_LABELS } from '@/lib/task-status';
import { TASK_STATUSES } from '@/types/api';

interface TaskFormProps {
  initialValues?: TaskFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

const EMPTY_VALUES: TaskFormValues = { title: '', description: '', status: 'todo', dueAt: '' };

export function TaskForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues, unknown, TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialValues,
  });

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit((data) => {
          if (!isSubmitting) onSubmit(data);
        })(event);
      }}
      noValidate
      className="space-y-4"
    >
      <TextField
        label="Title"
        type="text"
        autoComplete="off"
        data-autofocus
        error={errors.title?.message}
        {...register('title')}
      />
      <TextAreaField
        label="Description (optional)"
        rows={4}
        autoComplete="off"
        error={errors.description?.message}
        {...register('description')}
      />
      <TextField
        label="Due date and time (optional)"
        type="datetime-local"
        error={errors.dueAt?.message}
        {...register('dueAt')}
      />
      <SelectField label="Status" error={errors.status?.message} {...register('status')}>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {TASK_STATUS_LABELS[status]}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
