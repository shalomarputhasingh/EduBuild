'use client';

import React from 'react';
import Link from 'next/link';

/**
 * The single button in the app.
 *
 * The previous `.btn-primary` painted black text on an emerald-to-blue gradient,
 * which fails WCAG AA at every stop. These variants are solid colours checked
 * for at least 4.5:1 against their text.
 */
const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-white text-ink border border-surface-line hover:bg-surface-sunken active:bg-brand-50',
  ghost: 'bg-transparent text-ink-muted hover:bg-black/[0.04] hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100',

  /**
   * For use on a `.chalkboard` field, where the page's ink tokens are
   * unreadable. Chalk-white fill with board-green text is the highest contrast
   * pairing available on that surface.
   */
  chalk: 'bg-white text-board hover:bg-brand-50 active:bg-brand-100 shadow-sm',
  'chalk-outline': 'bg-transparent text-white border border-white/30 hover:bg-white/10 active:bg-white/[0.15]',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
    />
  </svg>
);

const Button = React.forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    to,
    href,
    className = '',
    children,
    ...props
  },
  ref
) {
  const classes = [
    'inline-flex items-center justify-center rounded-lg font-semibold',
    'transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  // Navigation renders as a real anchor so it is keyboard-reachable, focusable,
  // and openable in a new tab — none of which a div with onClick gives you.
  // The public prop stays `to`; next/link takes `href`.
  if (to) {
    return (
      <Link ref={ref} href={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={props.type || 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button;
