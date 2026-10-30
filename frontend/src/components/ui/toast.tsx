'use client';

import { CircleCheck, TriangleAlert, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { IconButton } from './icon-button';

type ToastKind = 'success' | 'error';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const TOAST_DURATION_MS = 5000;

const ToastContext = createContext<ToastApi | null>(null);

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'border-emerald-200 text-emerald-900',
  error: 'border-rose-200 text-rose-900',
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const Icon = toast.kind === 'success' ? CircleCheck : TriangleAlert;
  const iconTone = toast.kind === 'success' ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div
      className={`animate-sheet-in pointer-events-auto flex w-full items-center gap-3 rounded-2xl border bg-white py-2 pr-1.5 pl-4 text-sm font-medium shadow-lg ${KIND_CLASSES[toast.kind]}`}
    >
      <Icon className={`size-5 shrink-0 ${iconTone}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 py-1.5">{toast.message}</p>
      <IconButton
        label="Dismiss notification"
        onClick={() => {
          onDismiss(toast.id);
        }}
      >
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, message }]);
      timers.current.set(
        id,
        setTimeout(() => {
          dismiss(id);
        }, TOAST_DURATION_MS),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => {
        show('success', message);
      },
      error: (message) => {
        show('error', message);
      },
    }),
    [show],
  );

  return (
    <ToastContext value={api}>
      {children}
      {/* Raised on phones so notifications clear the floating "new task" button. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
