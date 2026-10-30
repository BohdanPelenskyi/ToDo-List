import { Inbox, Plus, SearchX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildTasksHref } from '@/lib/task-filters';
import { TASK_STATUS_LABELS } from '@/lib/task-status';
import type { TaskStatus } from '@/types/api';

interface TasksEmptyStateProps {
  status: TaskStatus | undefined;
  onCreate: () => void;
}

export function TasksEmptyState({ status, onCreate }: TasksEmptyStateProps) {
  const Icon = status ? SearchX : Inbox;

  return (
    <div className="rounded-3xl border border-dashed border-teal-300 bg-white/70 px-6 py-12 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-teal-100 text-teal-700">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      {status ? (
        <>
          <h2 className="mt-4 text-base font-bold text-ink">
            No tasks with status “{TASK_STATUS_LABELS[status]}”
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Change the filter or move a task to this status.
          </p>
          <Link
            href={buildTasksHref({})}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Show all tasks
          </Link>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-base font-bold text-ink">No tasks yet</h2>
          <p className="mt-1 text-sm text-slate-600">Create your first task to get started.</p>
          <Button className="mt-5" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Create task
          </Button>
        </>
      )}
    </div>
  );
}
