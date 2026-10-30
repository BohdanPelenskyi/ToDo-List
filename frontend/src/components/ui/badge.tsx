import type { ReactNode } from 'react';

export type BadgeTone = 'info' | 'warning' | 'success';

const TONE_CLASSES: Record<BadgeTone, string> = {
  info: 'bg-sky-100 text-sky-800 ring-sky-200',
  warning: 'bg-amber-100 text-amber-900 ring-amber-200',
  success: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
