import React from 'react';

const TONES = {
  neutral: 'bg-surface-sunken text-ink-muted ring-surface-line',
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  warning: 'bg-marigold-soft text-marigold-deep ring-marigold/40',
  // Filled rather than tinted, so "Published" cannot be mistaken for a subject
  // tag now that the whole palette is green.
  success: 'bg-brand-600 text-white ring-brand-600',
  danger: 'bg-red-50 text-red-800 ring-red-200',
};

/**
 * Badges are set in the mono face and uppercased, matching the spec strip, so
 * that everything which classifies a project reads as one family of labels
 * rather than as decoration.
 */
const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-wide ring-1 ring-inset ${
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
