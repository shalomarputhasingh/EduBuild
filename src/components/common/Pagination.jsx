'use client';

import React from 'react';
import Button from './Button';

const Pagination = ({ page, totalPages, onPageChange, className = '' }) => {
  if (totalPages <= 1) return null;

  // A window around the current page, so 200 pages does not render 200 buttons.
  const windowSize = 2;
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    const inWindow = Math.abs(i - page) <= windowSize;
    const isEdge = i === 1 || i === totalPages;
    if (inWindow || isEdge) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'gap') {
      pages.push('gap');
    }
  }

  return (
    <nav className={`flex items-center justify-center gap-1 ${className}`} aria-label="Pagination">
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>

      <ul className="mx-2 hidden items-center gap-1 sm:flex">
        {pages.map((p, index) =>
          p === 'gap' ? (
            <li key={`gap-${index}`} className="px-2 text-ink-subtle" aria-hidden="true">
              &hellip;
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Go to page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`h-9 min-w-[2.25rem] rounded-lg px-3 text-sm font-semibold transition-colors ${
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                }`}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ul>

      <span className="mx-2 text-sm text-ink-muted sm:hidden">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </nav>
  );
};

export default Pagination;
