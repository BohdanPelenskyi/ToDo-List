import type { ComponentPropsWithRef, ReactNode } from 'react';

type IconButtonTone = 'neutral' | 'danger';

interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-label'> {
  /** Names the action for screen readers and shows as the hover tooltip. */
  label: string;
  tone?: IconButtonTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<IconButtonTone, string> = {
  neutral:
    'text-slate-600 hover:bg-slate-100 hover:text-ink active:bg-slate-200 focus-visible:outline-teal-700',
  danger:
    'text-slate-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 focus-visible:outline-rose-700',
};

// The visible icon is small, but the hit area stays 44px on touch screens.
export function IconButton({
  label,
  tone = 'neutral',
  type = 'button',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:size-9 ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      <span aria-hidden="true" className="contents">
        {children}
      </span>
    </button>
  );
}
