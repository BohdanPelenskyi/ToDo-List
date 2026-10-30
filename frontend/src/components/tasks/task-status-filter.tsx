import { ListChecks } from 'lucide-react';
import Link from 'next/link';
import { buildTasksHref } from '@/lib/task-filters';
import { TASK_STATUS_ICONS, TASK_STATUS_LABELS } from '@/lib/task-status';
import { TASK_STATUSES, type TaskStatus } from '@/types/api';

const OPTIONS = [
  { status: undefined, label: 'All', Icon: ListChecks },
  ...TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    Icon: TASK_STATUS_ICONS[status],
  })),
];

// Plain links keep the filter in the URL, so it survives reloads and opens in a new tab.
// On narrow screens the chips scroll sideways instead of wrapping into several rows.
export function TaskStatusFilter({ active }: { active: TaskStatus | undefined }) {
  return (
    <nav
      aria-label="Filter tasks by status"
      className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {OPTIONS.map(({ status, label, Icon }) => {
        const isActive = status === active;
        return (
          <Link
            key={label}
            href={buildTasksHref({ status })}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:min-h-10 ${
              isActive
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-teal-50 hover:text-teal-800'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
