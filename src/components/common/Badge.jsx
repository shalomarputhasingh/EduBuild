import React from 'react';

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
};

const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
      TONES[tone] ?? TONES.neutral
    } ${className}`}
  >
    {children}
  </span>
);

/** Moderation status, with the same colour language everywhere it appears. */
export const StatusBadge = ({ status }) => {
  const map = {
    approved: { tone: 'success', label: 'Published' },
    pending: { tone: 'warning', label: 'Awaiting review' },
    rejected: { tone: 'danger', label: 'Needs changes' },
  };
  const { tone, label } = map[status] ?? map.pending;
  return <Badge tone={tone}>{label}</Badge>;
};

export default Badge;
