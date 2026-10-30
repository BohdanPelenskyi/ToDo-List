import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { TASK_STATUS_LABELS } from '@/lib/task-status';
import { isTaskStatus, TASK_STATUSES, type TaskStatus } from '@/types/api';

interface TaskStatusSelectProps {
  taskTitle: string;
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}

export function TaskStatusSelect({ taskTitle, value, onChange }: TaskStatusSelectProps) {
  const selectId = useId();

  return (
    <div className="relative min-w-0 flex-1 sm:flex-none">
      <label htmlFor={selectId} className="sr-only">
        Status of {taskTitle}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => {
          if (isTaskStatus(event.target.value)) onChange(event.target.value);
        }}
        className="min-h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pr-9 pl-3.5 text-base font-medium text-slate-700 shadow-sm focus-visible:outline-2 focus-visible:outline-teal-700 sm:min-h-9 sm:w-auto sm:text-sm"
      >
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {TASK_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </div>
  );
}
