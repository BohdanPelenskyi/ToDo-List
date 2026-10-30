'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { useTasks } from '@/features/tasks/use-tasks';
import { groupTasksByStatus, resolveDrop } from '@/lib/board';
import { TASK_STATUS_LABELS } from '@/lib/task-status';
import {
  isTaskStatus,
  TASK_STATUSES,
  type Task,
  type TaskFilters,
  type TaskStatus,
} from '@/types/api';
import { BoardCardPreview } from './board-card';
import { BoardColumn } from './board-column';
import { TaskListSkeleton } from './task-list-skeleton';
import { TasksErrorState } from './tasks-error-state';

// One request feeds all three columns; the API returns at most 100 tasks per page.
const BOARD_FILTERS: TaskFilters = { limit: 100, sort: 'dueAt', order: 'asc' };

interface TasksBoardProps {
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function TasksBoard({ onEdit, onDelete, onStatusChange }: TasksBoardProps) {
  const query = useTasks(BOARD_FILTERS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const { data } = query;
  if (query.isError) {
    return (
      <TasksErrorState
        onRetry={() => {
          void query.refetch();
        }}
        isRetrying={query.isFetching}
      />
    );
  }
  if (!data) return <TaskListSkeleton />;

  const tasksById = new Map(data.items.map((task) => [task.id, task]));
  const titleOf = (id: string | number) => tasksById.get(String(id))?.title ?? 'the task';
  const columnOf = (id: string | number | undefined) =>
    typeof id === 'string' && isTaskStatus(id) ? TASK_STATUS_LABELS[id] : 'a column';

  // Read out by screen readers while a card is moved with the keyboard.
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) => `${titleOf(active.id)} is over ${columnOf(over?.id)}.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${titleOf(active.id)} was dropped in ${columnOf(over.id)}.`
        : `${titleOf(active.id)} was dropped outside a column.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasksById.get(String(active.id)) ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    const task = tasksById.get(String(active.id));
    const status = task ? resolveDrop(task, over?.id) : null;
    if (task && status) onStatusChange(task, status);
  };

  const columns = groupTasksByStatus(data.items);

  return (
    <>
      <DndContext
        sensors={sensors}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveTask(null);
        }}
      >
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
        <DragOverlay>{activeTask && <BoardCardPreview task={activeTask} />}</DragOverlay>
      </DndContext>
      {data.meta.total > data.items.length && (
        <p className="mt-3 text-center text-sm text-slate-600">
          Showing the first {data.items.length} of {data.meta.total} tasks.
        </p>
      )}
    </>
  );
}
