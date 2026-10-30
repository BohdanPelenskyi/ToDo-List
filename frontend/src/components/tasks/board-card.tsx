import { useDraggable } from '@dnd-kit/core';
import { CalendarClock, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { formatDueAt, isOverdue } from '@/lib/datetime';
import { TASK_STATUS_ACCENTS } from '@/lib/task-status';
import type { Task } from '@/types/api';

interface BoardCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function BoardCard({ task, onEdit, onDelete }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <li
      ref={setNodeRef}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${TASK_STATUS_ACCENTS[task.status]}`}
      />
      <div className="flex items-start gap-1 p-2 pl-3.5">
        {/* Only the handle starts a drag, so the rest of the card still scrolls on touch screens. */}
        <button
          type="button"
          aria-label={`Move ${task.title}`}
          title="Drag to another column"
          className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-teal-700 active:cursor-grabbing sm:size-9"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1 py-1.5">
          <h3 className="text-sm font-bold break-words text-ink">{task.title}</h3>
          {task.dueAt && (
            <p
              className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${
                isOverdue(task.dueAt, task.status) ? 'text-rose-700' : 'text-slate-600'
              }`}
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              <time dateTime={task.dueAt}>{formatDueAt(task.dueAt)}</time>
            </p>
          )}
        </div>

        <div className="flex shrink-0">
          <IconButton
            label={`Edit ${task.title}`}
            onClick={() => {
              onEdit(task);
            }}
          >
            <Pencil className="size-4" />
          </IconButton>
          <IconButton
            label={`Delete ${task.title}`}
            tone="danger"
            onClick={() => {
              onDelete(task);
            }}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

// What follows the pointer while dragging: a static look-alike without hooks or buttons.
export function BoardCardPreview({ task }: { task: Task }) {
  return (
    <div className="relative cursor-grabbing overflow-hidden rounded-2xl border border-teal-300 bg-white p-3 pl-4 shadow-xl ring-2 ring-teal-500/40">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${TASK_STATUS_ACCENTS[task.status]}`}
      />
      <p className="text-sm font-bold break-words text-ink">{task.title}</p>
    </div>
  );
}
