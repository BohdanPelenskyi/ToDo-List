import { Circle, CircleCheck, Clock, type LucideIcon } from 'lucide-react';
import type { BadgeTone } from '@/components/ui/badge';
import type { TaskStatus } from '@/types/api';

// The API speaks "in_progress"; people read "In progress".
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const TASK_STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  todo: 'info',
  in_progress: 'warning',
  done: 'success',
};

export const TASK_STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  todo: Circle,
  in_progress: Clock,
  done: CircleCheck,
};

// The coloured strip on the edge of a task card.
export const TASK_STATUS_ACCENTS: Record<TaskStatus, string> = {
  todo: 'bg-sky-500',
  in_progress: 'bg-amber-500',
  done: 'bg-emerald-500',
};
