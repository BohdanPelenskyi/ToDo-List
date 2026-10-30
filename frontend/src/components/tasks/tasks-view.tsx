'use client';

import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { useTaskActions } from '@/features/tasks/use-task-actions';
import { useTaskDialogs } from '@/features/tasks/use-task-dialogs';
import { useTaskListParams } from '@/features/tasks/use-task-list-params';
import type { TaskView } from '@/lib/task-filters';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
import { TaskFormDialog } from './task-form-dialog';
import { TasksBanner } from './tasks-banner';
import { TasksBoard } from './tasks-board';
import { TasksCalendar } from './tasks-calendar';
import { TasksListView } from './tasks-list-view';
import { ViewSwitcher } from './view-switcher';

// The board needs room for three columns and the calendar for seven; the list reads best narrow.
const VIEW_WIDTH: Record<TaskView, string> = {
  list: 'max-w-3xl',
  board: 'max-w-6xl',
  calendar: 'max-w-5xl',
};

export function TasksView() {
  const { params, filters } = useTaskListParams();
  const dialogs = useTaskDialogs();
  const { changeStatus, deleteTask } = useTaskActions();

  const handlers = {
    onEdit: dialogs.openEdit,
    onDelete: dialogs.askDelete,
    onStatusChange: changeStatus,
  };

  return (
    <>
      <AppHeader widthClass={VIEW_WIDTH[params.view]} />
      <main className={`mx-auto px-4 pt-4 pb-28 sm:pt-6 sm:pb-12 ${VIEW_WIDTH[params.view]}`}>
        <TasksBanner />

        <div className="mt-5 mb-5 flex items-center justify-between gap-3 sm:mt-6">
          <ViewSwitcher active={params.view} />
          <div className="hidden shrink-0 sm:block">
            <Button onClick={dialogs.openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New task
            </Button>
          </div>
        </div>

        {params.view === 'list' && (
          <TasksListView
            params={params}
            filters={filters}
            onCreate={dialogs.openCreate}
            {...handlers}
          />
        )}
        {params.view === 'board' && <TasksBoard {...handlers} />}
        {params.view === 'calendar' && (
          <TasksCalendar
            month={params.month}
            day={params.day}
            onCreateOn={dialogs.openCreateOn}
            {...handlers}
          />
        )}
      </main>

      {/* On phones the primary action floats within thumb reach, clear of the home indicator. */}
      <button
        type="button"
        aria-label="Add task"
        onClick={dialogs.openCreate}
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 grid size-14 touch-manipulation place-items-center rounded-full bg-teal-700 text-white shadow-lg transition-colors hover:bg-teal-800 active:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <TaskFormDialog target={dialogs.formTarget} onClose={dialogs.closeForm} />
      <ConfirmDeleteDialog
        task={dialogs.deleteTarget}
        onCancel={dialogs.closeDelete}
        onConfirm={(task) => {
          // Close first: the list already updates optimistically and a toast reports the outcome.
          dialogs.closeDelete();
          deleteTask(task);
        }}
      />
    </>
  );
}
