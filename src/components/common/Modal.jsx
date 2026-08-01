'use client';

import React, { useEffect, useRef } from 'react';
import Button from './Button';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: focus moves in on open, is trapped while open, Escape
 * closes, and focus returns to whatever opened it.
 *
 * This exists to replace window.confirm(), which cannot be styled, cannot be
 * tested, and blocks the whole browser tab.
 */
const Modal = ({ open, onClose, title, description, children, footer, initialFocusRef }) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    const target = initialFocusRef?.current || panelRef.current;
    target?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    // Stop the page behind the dialog scrolling along with it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-board/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-lg animate-fade-in rounded-card bg-white shadow-card-hover"
      >
        <div className="border-b border-surface-line p-5">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {children && <div className="p-5">{children}</div>}
        {footer && (
          <div className="flex justify-end gap-3 border-t border-surface-line p-5">{footer}</div>
        )}
      </div>
    </div>
  );
};

/** Destructive-action confirmation. Replaces window.confirm. */
export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    description={description}
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }
  />
);

export default Modal;
