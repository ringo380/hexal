// ToastContext — Provides toast notifications via a portal-rendered UI.
// Usage: const toast = useToast(); toast('Saved!', { variant: 'success' });
// Action buttons: toast('Deleted', { variant: 'success', action: { label: 'Undo', onClick: handleUndo } });
// History: const { history, unreadCount, showHistory, toggleHistory, clearHistory } = useToastHistory();

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
import Icon from '../components/icons/Icon';

type ToastVariant = 'info' | 'success' | 'error' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  isExiting: boolean;
}

interface HistoryEntry {
  id: number;
  message: string;
  variant: ToastVariant;
  timestamp: number;
}

type ToastFn = (message: string, options?: ToastOptions) => void;

interface ToastContextValue {
  toast: ToastFn;
  history: HistoryEntry[];
  unreadCount: number;
  showHistory: boolean;
  toggleHistory: () => void;
  clearHistory: () => void;
}

const MAX_TOASTS = 3;
const MAX_HISTORY = 50;
const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 8000;
const EXIT_ANIMATION_MS = 300;

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  history: [],
  unreadCount: 0,
  showHistory: false,
  toggleHistory: () => {},
  clearHistory: () => {},
});

export function useToast(): ToastFn {
  return useContext(ToastContext).toast;
}

export function useToastHistory() {
  const { history, unreadCount, showHistory, toggleHistory, clearHistory } =
    useContext(ToastContext);
  return { history, unreadCount, showHistory, toggleHistory, clearHistory };
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Outside-click dismissal for history panel (ref-based contains() per project conventions)
  useEffect(() => {
    if (!showHistory) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        historyPanelRef.current &&
        !historyPanelRef.current.contains(target) &&
        historyButtonRef.current &&
        !historyButtonRef.current.contains(target)
      ) {
        setShowHistory(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showHistory]);

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

      const entry: ToastEntry = { id, message, variant, action: options.action, isExiting: false };

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

      // Add to history
      setHistory((prev) => {
        const histEntry: HistoryEntry = { id, message, variant, timestamp: Date.now() };
        const next = [histEntry, ...prev];
        if (next.length > MAX_HISTORY) next.length = MAX_HISTORY;
        return next;
      });
      setUnreadCount((c) => c + 1);

      // Auto-dismiss timer
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setUnreadCount(0);
  }, []);

  const contextValue: ToastContextValue = {
    toast,
    history,
    unreadCount,
    showHistory,
    toggleHistory,
    clearHistory,
  };

  return (
    <ToastContext.Provider value={contextValue}>
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
              {t.action && (
                <button
                  className="toast-action"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button
                className="toast-dismiss"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          ))}

          {/* History toggle button */}
          <button
            ref={historyButtonRef}
            className="toast-history-toggle"
            onClick={toggleHistory}
            aria-label="Notification history"
          >
            <Icon name="bell" size={16} />
            {unreadCount > 0 && (
              <span className="toast-history-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* History panel */}
          {showHistory && (
            <div ref={historyPanelRef} className="toast-history-panel">
              <div className="toast-history-header">
                <span>Notifications</span>
                {history.length > 0 && (
                  <button
                    className="toast-history-clear"
                    onClick={clearHistory}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="toast-history-list">
                {history.length === 0 ? (
                  <div className="empty-hint" style={{ padding: '16px', textAlign: 'center' }}>
                    No notifications yet
                  </div>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className={`toast-history-item toast-history-item--${h.variant}`}>
                      <span className="toast-history-message">{h.message}</span>
                      <span className="toast-history-time">{formatTimeAgo(h.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
