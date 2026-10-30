import { CalendarClock, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { formatDueAt, isOverdue } from '@/lib/datetime';
import { formatDate } from '@/lib/format';
import { TASK_STATUS_ACCENTS } from '@/lib/task-status';
import type { Task, TaskStatus } from '@/types/api';
import { StatusBadge } from './status-badge';
import { TaskStatusSelect } from './task-status-select';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

function DueDate({ dueAt, overdue }: { dueAt: string; overdue: boolean }) {
  return (
    <p
      className={`flex items-center gap-1.5 text-sm font-semibold ${overdue ? 'text-rose-700' : 'text-slate-700'}`}
    >
      <CalendarClock className="size-4" aria-hidden="true" />
      <span>
        Due <time dateTime={dueAt}>{formatDueAt(dueAt)}</time>
        {overdue && (
          <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-xs">Overdue</span>
        )}
      </span>
    </p>
  );
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  return (
    <li className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${TASK_STATUS_ACCENTS[task.status]}`}
      />
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-base font-bold break-words text-ink">{task.title}</h2>
          <StatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="mt-2 line-clamp-2 text-sm break-words text-slate-600">{task.description}</p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {task.dueAt && (
              <DueDate dueAt={task.dueAt} overdue={isOverdue(task.dueAt, task.status)} />
            )}
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              <span>
                Created <time dateTime={task.createdAt}>{formatDate(task.createdAt)}</time>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <TaskStatusSelect
              taskTitle={task.title}
              value={task.status}
              onChange={(status) => {
                onStatusChange(task, status);
              }}
            />
            <IconButton
              label={`Edit ${task.title}`}
              onClick={() => {
                onEdit(task);
              }}
            >
              <Pencil className="size-[18px]" />
            </IconButton>
            <IconButton
              label={`Delete ${task.title}`}
              tone="danger"
              onClick={() => {
                onDelete(task);
              }}
            >
              <Trash2 className="size-[18px]" />
            </IconButton>
          </div>
        </div>
      </div>
    </li>
  );
}
