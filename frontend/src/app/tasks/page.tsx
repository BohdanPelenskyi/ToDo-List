import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TasksView } from '@/components/tasks/tasks-view';

export const metadata: Metadata = { title: 'Tasks · TODO' };

export default function TasksPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prerendered.
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  );
}
