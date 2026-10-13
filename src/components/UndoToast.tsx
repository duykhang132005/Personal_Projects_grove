import { useEffect } from 'react';
import { useGrove } from '../context/useGrove';
import type { ToastState } from '../context/grove-context';

const TOAST_MS = 6000;
const ERROR_TOAST_MS = 8000;

interface ItemProps {
  toast: ToastState;
  onUndo: (id: number) => void;
  onDismiss: (id: number) => void;
}

/** One toast with its own auto-dismiss timer. */
function ToastItem({ toast, onUndo, onDismiss }: ItemProps) {
  useEffect(() => {
    const ms = toast.kind === 'error' ? ERROR_TOAST_MS : TOAST_MS;
    const t = window.setTimeout(() => onDismiss(toast.id), ms);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.kind, onDismiss]);

  return (
    <div className={`toast toast-${toast.kind}`}>
      <span>{toast.message}</span>
      {toast.kind === 'undo' && (
        <button type="button" className="toast-undo" onClick={() => onUndo(toast.id)}>
          Undo
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

/** Shared toast stack: Undo toasts for deletes plus plain info / error notices. */
export function UndoToast() {
  const { toasts, undo, dismissToast } = useGrove();

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onUndo={undo} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
