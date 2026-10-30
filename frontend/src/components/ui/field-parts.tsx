import { useId, type ReactNode } from 'react';

// Shared pieces so every form control wires its label, hint and error the same accessible way.
export function useFieldIds(id: string | undefined, error?: string, hint?: string) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return { inputId, errorId, hintId, describedBy };
}

// 16px text on phones stops iOS Safari from zooming into the field on focus.
export function fieldControlClass(hasError: boolean): string {
  const border = hasError
    ? 'border-rose-500 focus-visible:outline-rose-500'
    : 'border-slate-300 focus-visible:outline-teal-700';

  return `block min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-ink shadow-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-0 sm:text-sm ${border}`;
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}
    </label>
  );
}

export function FieldMessages({
  errorId,
  hintId,
  error,
  hint,
}: {
  errorId: string;
  hintId: string;
  error?: string;
  hint?: string;
}) {
  return (
    <>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </>
  );
}
