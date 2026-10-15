import { useEffect, useRef, useState } from 'react';
import { useGrove } from '../context/useGrove';
import type { ToastState } from '../context/grove-context';

const TOAST_MS = 6000;
const ERROR_TOAST_MS = 8000;
/** Minimum time left after a pause ends, so a toast never vanishes the instant you leave it */
const RESUME_MIN_MS = 1500;

interface ItemProps {
  toast: ToastState;
  paused: boolean;
  onUndo: (id: number) => void;
  onDismiss: (id: number) => void;
  onAction: (id: number) => void;
}

/** One toast with its own auto-dismiss timer, which stops while `paused`. */
function ToastItem({ toast, paused, onUndo, onDismiss, onAction }: ItemProps) {
  const remaining = useRef(toast.kind === 'error' ? ERROR_TOAST_MS : TOAST_MS);

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const t = window.setTimeout(
      () => onDismiss(toast.id),
      Math.max(remaining.current, RESUME_MIN_MS)
    );
    return () => {
      window.clearTimeout(t);
      // Keep the time left so the timer resumes instead of restarting
      remaining.current -= Date.now() - started;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div className={`toast toast-${toast.kind}`}>
      <span>{toast.message}</span>
      {toast.kind === 'undo' && (
        <button type="button" className="toast-undo" onClick={() => onUndo(toast.id)}>
          Undo
        </button>
      )}
      {toast.actionLabel && (
        <button
          type="button"
          className="toast-undo"
          onClick={() => onAction(toast.id)}
          aria-label={toast.actionAriaLabel}
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Shared toast stack: Undo toasts for deletes plus plain info / error notices.
 * Timers pause while the pointer is over the stack or focus is inside it.
 */
export function UndoToast() {
  const { toasts, undo, dismissToast, runToastAction } = useGrove();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Once the stack is empty nothing can fire leave or blur, so reset here
  if (toasts.length === 0 && (hovered || focused)) {
    setHovered(false);
    setFocused(false);
  }

  return (
    <div
      className="toast-region"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Still focused if focus just moved to another button in the stack
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          paused={hovered || focused}
          onUndo={undo}
          onDismiss={dismissToast}
          onAction={runToastAction}
        />
      ))}
    </div>
  );
}
