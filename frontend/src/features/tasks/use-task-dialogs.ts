import { useState } from 'react';
import type { Task } from '@/types/api';

// Creating can start from a given day (the calendar passes it as local "YYYY-MM-DDTHH:mm").
export type FormTarget = { mode: 'create'; dueAt?: string } | { mode: 'edit'; task: Task } | null;

export function useTaskDialogs() {
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  return {
    formTarget,
    deleteTarget,
    openCreate: () => {
      setFormTarget({ mode: 'create' });
    },
    openCreateOn: (dueAt: string) => {
      setFormTarget({ mode: 'create', dueAt });
    },
    openEdit: (task: Task) => {
      setFormTarget({ mode: 'edit', task });
    },
    closeForm: () => {
      setFormTarget(null);
    },
    askDelete: (task: Task) => {
      setDeleteTarget(task);
    },
    closeDelete: () => {
      setDeleteTarget(null);
    },
  };
}
