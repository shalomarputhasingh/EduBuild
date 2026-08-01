import React from 'react';

export const Card = ({ as: Tag = 'div', className = '', children, ...props }) => (
  <Tag
    className={`rounded-card border border-slate-200 bg-white shadow-card ${className}`}
    {...props}
  >
    {children}
  </Tag>
);

export const CardBody = ({ className = '', children }) => (
  <div className={`p-5 sm:p-6 ${className}`}>{children}</div>
);

export const CardHeader = ({ title, description, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6 ${className}`}>
    <div className="min-w-0">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
    </div>
    {action}
  </div>
);

export default Card;
