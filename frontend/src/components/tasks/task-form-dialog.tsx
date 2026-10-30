'use client';

import { Modal } from '@/components/ui/modal';
import { useTaskActions } from '@/features/tasks/use-task-actions';
import type { FormTarget } from '@/features/tasks/use-task-dialogs';
import { toLocalInputValue } from '@/lib/datetime';
import type { TaskFormData, TaskFormValues } from '@/lib/schemas/task';
import { TaskForm } from './task-form';

interface TaskFormDialogProps {
  target: FormTarget;
  onClose: () => void;
}

function initialValuesFor(target: NonNullable<FormTarget>): TaskFormValues {
  if (target.mode === 'edit') {
    const { title, description, status, dueAt } = target.task;
    return { title, description: description ?? '', status, dueAt: toLocalInputValue(dueAt) };
  }
  return { title: '', description: '', status: 'todo', dueAt: target.dueAt ?? '' };
}

export function TaskFormDialog({ target, onClose }: TaskFormDialogProps) {
  const { createTask, saveTask, isSaving } = useTaskActions();

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  const handleSubmit = (data: TaskFormData) => {
    if (target?.mode === 'edit') saveTask(target.task.id, data, onClose);
    else createTask(data, onClose);
  };

  const isEditing = target?.mode === 'edit';

  return (
    <Modal
      open={target !== null}
      title={isEditing ? 'Edit task' : 'New task'}
      onClose={handleClose}
    >
      {target && (
        <TaskForm
          // A new key resets the form whenever a different task or day is opened.
          key={target.mode === 'edit' ? target.task.id : `new-${target.dueAt ?? ''}`}
          initialValues={initialValuesFor(target)}
          submitLabel={isEditing ? 'Save changes' : 'Create task'}
          isSubmitting={isSaving}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      )}
    </Modal>
  );
}
