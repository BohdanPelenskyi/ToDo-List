import { CalendarDays, Columns3, LayoutList, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { buildTasksHref, type TaskView } from '@/lib/task-filters';

const VIEWS: { view: TaskView; label: string; Icon: LucideIcon }[] = [
  { view: 'list', label: 'List', Icon: LayoutList },
  { view: 'board', label: 'Board', Icon: Columns3 },
  { view: 'calendar', label: 'Calendar', Icon: CalendarDays },
];

// Links, not buttons: the chosen view lives in the URL, so it survives a reload and can be shared.
export function ViewSwitcher({ active }: { active: TaskView }) {
  return (
    <nav
      aria-label="Choose a view"
      className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:inline-grid"
    >
      {VIEWS.map(({ view, label, Icon }) => (
        <Link
          key={view}
          href={buildTasksHref({ view })}
          aria-current={view === active ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:min-h-10 ${
            view === active
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800'
          }`}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
