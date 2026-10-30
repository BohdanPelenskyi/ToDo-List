'use client';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { Task } from '@/types/api';

interface ConfirmDeleteDialogProps {
  task: Task | null;
  onConfirm: (task: Task) => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({ task, onConfirm, onCancel }: ConfirmDeleteDialogProps) {
  return (
    <Modal open={task !== null} title="Delete task?" onClose={onCancel}>
      {task && (
        <>
          <p className="text-sm break-words text-slate-600">
            “{task.title}” will be permanently deleted. This cannot be undone.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {/* data-autofocus keeps the initial focus on the safe choice, not on the close icon or Delete. */}
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              data-autofocus
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                onConfirm(task);
              }}
            >
              Delete
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
