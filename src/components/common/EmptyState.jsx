import React from 'react';
import Button from './Button';

/**
 * An empty result is a dead end unless it offers a way forward, so `action` is
 * part of the component rather than an afterthought at each call site.
 */
const EmptyState = ({ icon = '📭', title, description, action, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-card border border-dashed border-slate-300 bg-white px-6 py-16 text-center ${className}`}
  >
    <div className="text-4xl" aria-hidden="true">
      {icon}
    </div>
    <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-ink-muted">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const ErrorState = ({
  title = 'Something went wrong',
  description,
  onRetry,
  className = '',
}) => (
  <div
    role="alert"
    className={`flex flex-col items-center justify-center rounded-card border border-red-200 bg-red-50 px-6 py-12 text-center ${className}`}
  >
    <div className="text-3xl" aria-hidden="true">
      ⚠️
    </div>
    <h3 className="mt-3 text-lg font-semibold text-red-900">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm text-red-800">{description}</p>}
    {onRetry && (
      <Button variant="secondary" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export default EmptyState;
