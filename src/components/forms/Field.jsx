import React, { useId } from 'react';

/**
 * Form field primitives.
 *
 * Every control is wired to its label and, when invalid, to its error message
 * via aria-describedby — so a screen reader announces the problem rather than
 * leaving the user to guess why a submission failed.
 */

const baseControl =
  'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle ' +
  'transition-colors disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-subtle';

const toneFor = (error) =>
  error
    ? 'border-red-400 focus:border-red-500'
    : 'border-surface-line focus:border-brand-600 hover:border-brand-300';

export const Field = ({ label, htmlFor, error, hint, required, children, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    {children}
    {error ? (
      <p id={`${htmlFor}-error`} className="text-sm font-medium text-red-700">
        {error}
      </p>
    ) : (
      hint && (
        <p id={`${htmlFor}-hint`} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )
    )}
  </div>
);

export const TextInput = ({ label, error, hint, required, className, id, ...props }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Field label={label} htmlFor={fieldId} error={error} hint={hint} required={required} className={className}>
      <input
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={`${baseControl} ${toneFor(error)}`}
        {...props}
      />
    </Field>
  );
};

export const TextArea = ({ label, error, hint, required, rows = 4, className, id, ...props }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Field label={label} htmlFor={fieldId} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={`${baseControl} ${toneFor(error)} resize-y`}
        {...props}
      />
    </Field>
  );
};

export const Select = ({ label, error, hint, required, options = [], className, id, children, ...props }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <Field label={label} htmlFor={fieldId} error={error} hint={hint} required={required} className={className}>
      <select
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={`${baseControl} ${toneFor(error)} pr-8`}
        {...props}
      >
        {children ||
          options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            );
          })}
      </select>
    </Field>
  );
};

export default Field;
