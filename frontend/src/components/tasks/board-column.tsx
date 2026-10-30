import { useDroppable } from '@dnd-kit/core';
import { TASK_STATUS_ICONS, TASK_STATUS_LABELS } from '@/lib/task-status';
import type { Task, TaskStatus } from '@/types/api';
import { BoardCard } from './board-card';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function BoardColumn({ status, tasks, ...handlers }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const Icon = TASK_STATUS_ICONS[status];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${TASK_STATUS_LABELS[status]}, ${String(tasks.length)} ${tasks.length === 1 ? 'task' : 'tasks'}`}
      className={`flex min-w-[84%] snap-center flex-col rounded-3xl p-3 ring-1 transition-colors sm:min-w-0 ${
        isOver ? 'bg-teal-50 ring-2 ring-teal-500' : 'bg-white/70 ring-slate-200'
      }`}
    >
      <header className="flex items-center gap-2 px-1 pb-3 text-sm font-bold text-ink">
        <Icon className="size-4 text-slate-500" aria-hidden="true" />
        <h2>{TASK_STATUS_LABELS[status]}</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {tasks.length}
        </span>
      </header>
      <ul className="min-h-28 space-y-2.5">
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} {...handlers} />
        ))}
        {tasks.length === 0 && (
          <li className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-slate-300 px-3 text-center text-sm text-slate-500">
            Drop tasks here
          </li>
        )}
      </ul>
    </section>
  );
}
