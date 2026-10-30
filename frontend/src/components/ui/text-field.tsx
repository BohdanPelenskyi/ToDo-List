import type { ComponentPropsWithRef } from 'react';
import { fieldControlClass, FieldLabel, FieldMessages, useFieldIds } from './field-parts';

interface TextFieldProps extends ComponentPropsWithRef<'input'> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, className = '', ...props }: TextFieldProps) {
  const { inputId, errorId, hintId, describedBy } = useFieldIds(id, error, hint);

  return (
    <div>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldControlClass(Boolean(error))} ${className}`}
        {...props}
      />
      <FieldMessages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
}
