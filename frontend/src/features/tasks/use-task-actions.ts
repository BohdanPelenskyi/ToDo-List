import { useToast } from '@/components/ui/toast';
import { describeError } from '@/lib/error-message';
import { TASK_STATUS_LABELS } from '@/lib/task-status';
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from '@/types/api';
import { useCreateTask, useDeleteTask, useUpdateTask } from './use-tasks';

// Wraps the mutations with user feedback, so components only say what should happen.
export function useTaskActions() {
  const toast = useToast();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();

  const reportFailure = (action: string) => (error: Error) => {
    toast.error(`Could not ${action}. ${describeError(error)}`);
  };

  return {
    isSaving: create.isPending || update.isPending,

    createTask: (input: CreateTaskInput, onSuccess: () => void) => {
      create.mutate(input, {
        onSuccess: () => {
          toast.success('Task created.');
          onSuccess();
        },
        onError: reportFailure('create the task'),
      });
    },

    saveTask: (id: string, changes: UpdateTaskInput, onSuccess: () => void) => {
      update.mutate(
        { id, changes },
        {
          onSuccess: () => {
            toast.success('Task updated.');
            onSuccess();
          },
          onError: reportFailure('update the task'),
        },
      );
    },

    changeStatus: (task: Task, status: TaskStatus) => {
      update.mutate(
        { id: task.id, changes: { status } },
        {
          onSuccess: () => {
            toast.success(`Moved to “${TASK_STATUS_LABELS[status]}”.`);
          },
          onError: reportFailure('change the status'),
        },
      );
    },

    deleteTask: (task: Task) => {
      remove.mutate(task.id, {
        onSuccess: () => {
          toast.success('Task deleted.');
        },
        onError: reportFailure('delete the task'),
      });
    },
  };
}
