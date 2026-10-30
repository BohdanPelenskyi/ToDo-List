import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { fieldControlClass, FieldLabel, FieldMessages, useFieldIds } from './field-parts';

interface SelectFieldProps extends ComponentPropsWithRef<'select'> {
  label: string;
  error?: string;
  hint?: string;
}

export function SelectField({
  label,
  error,
  hint,
  id,
  className = '',
  children,
  ...props
}: SelectFieldProps) {
  const { inputId, errorId, hintId, describedBy } = useFieldIds(id, error, hint);

  return (
    <div>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className="relative">
        <select
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${fieldControlClass(Boolean(error))} appearance-none pr-10 ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
      </div>
      <FieldMessages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
}
