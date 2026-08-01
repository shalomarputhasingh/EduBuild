import React from 'react';

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

const Spinner = ({ size = 'md', label = 'Loading' }) => (
  <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
    <svg className={`animate-spin text-brand-600 ${SIZES[size]}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
    <span className="sr-only">{label}</span>
  </span>
);

export default Spinner;
