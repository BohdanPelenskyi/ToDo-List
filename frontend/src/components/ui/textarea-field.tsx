import type { ComponentPropsWithRef } from 'react';
import { fieldControlClass, FieldLabel, FieldMessages, useFieldIds } from './field-parts';

interface TextAreaFieldProps extends ComponentPropsWithRef<'textarea'> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: TextAreaFieldProps) {
  const { inputId, errorId, hintId, describedBy } = useFieldIds(id, error, hint);

  return (
    <div>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldControlClass(Boolean(error))} resize-y ${className}`}
        {...props}
      />
      <FieldMessages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
}
