'use client';

import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/features/tasks/use-tasks';
import {
  buildMonthGrid,
  defaultDayKey,
  gridRange,
  groupTasksByDay,
  parseDayKey,
  parseMonthKey,
  shiftMonth,
  toDayKey,
  toMonthKey,
} from '@/lib/calendar';
import { buildTasksHref } from '@/lib/task-filters';
import { TASK_STATUS_ACCENTS } from '@/lib/task-status';
import type { Task, TaskFilters, TaskStatus } from '@/types/api';
import { TaskList } from './task-list';
import { TaskListSkeleton } from './task-list-skeleton';
import { TasksErrorState } from './tasks-error-state';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_DOTS = 3;
const DEFAULT_TIME = '09:00';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

interface TasksCalendarProps {
  month: string | undefined;
  day: string | undefined;
  onCreateOn: (localDateTime: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

const NAV_LINK_CLASS =
  'inline-flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:size-10';

function pluralTasks(count: number): string {
  return `${String(count)} ${count === 1 ? 'task' : 'tasks'}`;
}

export function TasksCalendar({
  month,
  day,
  onCreateOn,
  onEdit,
  onDelete,
  onStatusChange,
}: TasksCalendarProps) {
  const today = new Date();
  const monthKey = month ?? toMonthKey(today);
  const dayKey = day?.startsWith(monthKey) ? day : defaultDayKey(monthKey, today);

  const grid = useMemo(() => buildMonthGrid(monthKey), [monthKey]);
  const filters = useMemo<TaskFilters>(
    () => ({ ...gridRange(grid), limit: 100, sort: 'dueAt', order: 'asc' }),
    [grid],
  );
  const query = useTasks(filters);
  const tasksByDay = useMemo(() => groupTasksByDay(query.data?.items ?? []), [query.data]);
  const dayTasks = tasksByDay.get(dayKey) ?? [];

  return (
    <div className="space-y-5">
      <section
        aria-label="Calendar"
        className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-5"
      >
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            {monthFormatter.format(parseMonthKey(monthKey))}
          </h2>
          <nav aria-label="Change month" className="flex items-center gap-1">
            <Link
              href={buildTasksHref({ view: 'calendar' })}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:min-h-10"
            >
              Today
            </Link>
            <Link
              href={buildTasksHref({ view: 'calendar', month: shiftMonth(monthKey, -1) })}
              aria-label="Previous month"
              title="Previous month"
              className={NAV_LINK_CLASS}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Link>
            <Link
              href={buildTasksHref({ view: 'calendar', month: shiftMonth(monthKey, 1) })}
              aria-label="Next month"
              title="Next month"
              className={NAV_LINK_CLASS}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </Link>
          </nav>
        </header>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className="py-1">
              {weekday}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((date) => {
            const key = toDayKey(date);
            const tasks = tasksByDay.get(key) ?? [];
            const inMonth = toMonthKey(date) === monthKey;
            const isSelected = key === dayKey;
            const isToday = key === toDayKey(today);

            return (
              <Link
                key={key}
                href={buildTasksHref({ view: 'calendar', month: toMonthKey(date), day: key })}
                aria-label={`${dayFormatter.format(date)}, ${pluralTasks(tasks.length)}${isSelected ? ', selected' : ''}`}
                aria-current={isToday ? 'date' : undefined}
                data-selected={isSelected || undefined}
                className={`flex min-h-14 flex-col items-center gap-1 rounded-xl p-1 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700 sm:min-h-20 sm:p-2 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-sm'
                    : inMonth
                      ? 'text-ink hover:bg-teal-50'
                      : 'text-slate-400 hover:bg-slate-50'
                } ${isToday && !isSelected ? 'ring-2 ring-teal-600' : ''}`}
              >
                <span>{date.getDate()}</span>
                <span className="flex items-center justify-center gap-0.5" aria-hidden="true">
                  {tasks.slice(0, MAX_DOTS).map((task) => (
                    <span
                      key={task.id}
                      className={`size-1.5 rounded-full sm:size-2 ${isSelected ? 'bg-white' : TASK_STATUS_ACCENTS[task.status]}`}
                    />
                  ))}
                  {tasks.length > MAX_DOTS && (
                    <span className="text-[10px] leading-none">+{tasks.length - MAX_DOTS}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        {query.data && query.data.meta.total > query.data.items.length && (
          <p className="mt-3 text-center text-sm text-slate-600">
            Showing the first {query.data.items.length} of {query.data.meta.total} tasks this month.
          </p>
        )}
      </section>

      <section aria-labelledby="agenda-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="agenda-heading" className="text-lg font-extrabold tracking-tight text-ink">
              {dayFormatter.format(parseDayKey(dayKey))}
            </h2>
            <p className="text-sm text-slate-600">{pluralTasks(dayTasks.length)} scheduled</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onCreateOn(`${dayKey}T${DEFAULT_TIME}`);
            }}
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Add to this day
          </Button>
        </div>

        {query.isError ? (
          <TasksErrorState
            onRetry={() => {
              void query.refetch();
            }}
            isRetrying={query.isFetching}
          />
        ) : !query.data ? (
          <TaskListSkeleton />
        ) : dayTasks.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-sm text-slate-600">
            Nothing is scheduled for this day.
          </p>
        ) : (
          <TaskList
            tasks={dayTasks}
            isRefreshing={query.isPlaceholderData}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        )}
      </section>
    </div>
  );
}
