import { Badge } from '@/components/ui/badge';
import { TASK_STATUS_ICONS, TASK_STATUS_LABELS, TASK_STATUS_TONES } from '@/lib/task-status';
import type { TaskStatus } from '@/types/api';

export function StatusBadge({ status }: { status: TaskStatus }) {
  const Icon = TASK_STATUS_ICONS[status];

  return (
    <Badge tone={TASK_STATUS_TONES[status]}>
      <Icon className="size-3.5" aria-hidden="true" />
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
