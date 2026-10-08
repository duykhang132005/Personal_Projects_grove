import { useEffect } from 'react';
import { useGrove } from '../context/useGrove';

const TOAST_MS = 6000;
const ERROR_TOAST_MS = 8000;

/** Shared toast area: Undo toasts for deletes plus plain info / error notices. */
export function UndoToast() {
  const { toast, undo, dismissToast } = useGrove();

  useEffect(() => {
    if (!toast) return;
    const ms = toast.kind === 'error' ? ERROR_TOAST_MS : TOAST_MS;
    const t = window.setTimeout(dismissToast, ms);
    return () => window.clearTimeout(t);
  }, [toast, dismissToast]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className={`toast toast-${toast.kind}`} key={toast.id}>
          <span>{toast.message}</span>
          {toast.kind === 'undo' && (
            <button type="button" className="toast-undo" onClick={undo}>
              Undo
            </button>
          )}
          <button
            type="button"
            className="toast-close"
            onClick={dismissToast}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
