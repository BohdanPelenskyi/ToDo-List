import type { Task } from '@/types/api';
import { TaskCard } from './task-card';

interface TaskListProps {
  tasks: Task[];
  isRefreshing: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => void;
}

export function TaskList({ tasks, isRefreshing, ...handlers }: TaskListProps) {
  return (
    <ul
      aria-label="Tasks"
      aria-busy={isRefreshing}
      className={`space-y-3 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}
    >
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} {...handlers} />
      ))}
    </ul>
  );
}
