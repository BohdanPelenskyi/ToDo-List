import { LoaderCircle } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-700 text-white shadow-sm hover:bg-teal-800 active:bg-teal-900 focus-visible:outline-teal-700',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-teal-700',
  danger:
    'bg-rose-700 text-white shadow-sm hover:bg-rose-800 active:bg-rose-900 focus-visible:outline-rose-700',
};

// 44px tall on touch screens, a little denser on larger ones.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3.5 text-sm sm:min-h-9 sm:px-3',
  md: 'min-h-11 px-5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={Boolean(disabled) || loading}
      aria-busy={loading}
      className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
