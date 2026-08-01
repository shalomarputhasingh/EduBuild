import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TONES = {
  success: 'bg-emerald-700 text-white',
  error: 'bg-red-700 text-white',
  info: 'bg-slate-800 text-white',
};

let nextId = 0;

/**
 * Replaces alert(): non-blocking, styled, dismissible, and announced to screen
 * readers through the aria-live region below.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, tone = 'info', duration = 4000) => {
      nextId += 1;
      const id = nextId;
      setToasts((current) => [...current, { id, message, tone }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      success: (m, d) => show(m, 'success', d),
      // Errors linger: they usually need reading, and sometimes acting on.
      error: (m, d) => show(m, 'error', d ?? 7000),
      info: (m, d) => show(m, 'info', d),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-card-hover animate-fade-in ${
              TONES[toast.tone] ?? TONES.info
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export default ToastProvider;
