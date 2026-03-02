// ToastContext — Provides toast notifications via a portal-rendered UI.
// Usage: const toast = useToast(); toast('Saved!', { variant: 'success' });

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'info' | 'success' | 'error' | 'warning';

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
  isExiting: boolean;
}

type ToastFn = (message: string, options?: ToastOptions) => void;

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 8000;
const EXIT_ANIMATION_MS = 300;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    // Start exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t)));

    // Remove after animation completes
    const exitTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, EXIT_ANIMATION_MS);

    // Clear any existing auto-dismiss timer and replace with exit timer
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    timersRef.current.set(id, exitTimer);
  }, []);

  const toast: ToastFn = useCallback(
    (message, options = {}) => {
      const variant = options.variant ?? 'info';
      const duration = options.duration ?? (variant === 'error' ? ERROR_DURATION : DEFAULT_DURATION);
      const id = ++counterRef.current;

      const entry: ToastEntry = { id, message, variant, isExiting: false };

      setToasts((prev) => {
        const next = [...prev, entry];
        // If over the limit, dismiss the oldest (which triggers exit animation)
        if (next.length > MAX_TOASTS) {
          const oldest = next.find((t) => !t.isExiting);
          if (oldest) {
            // Schedule dismiss of the oldest toast
            setTimeout(() => dismiss(oldest.id), 0);
          }
        }
        return next;
      });

      // Auto-dismiss timer
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="toast-container" role="log" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast--${t.variant}${t.isExiting ? ' toast-exit' : ' toast-enter'}`}
              role="status"
            >
              <span className="toast-message">{t.message}</span>
              <button
                className="toast-dismiss"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
