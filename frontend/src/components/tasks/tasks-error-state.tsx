import { RotateCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TasksErrorStateProps {
  onRetry: () => void;
  isRetrying: boolean;
}

export function TasksErrorState({ onRetry, isRetrying }: TasksErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center"
    >
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-rose-100 text-rose-700">
        <WifiOff className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-bold text-rose-950">Could not load your tasks</h2>
      <p className="mt-1 text-sm text-rose-900">Check your connection and try again.</p>
      <Button variant="secondary" className="mt-5" onClick={onRetry} loading={isRetrying}>
        {!isRetrying && <RotateCw className="size-4" aria-hidden="true" />}
        Try again
      </Button>
    </div>
  );
}
