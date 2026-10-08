import { useEffect } from 'react';
import { useGrove } from '../context/useGrove';

const TOAST_MS = 6000;

export function UndoToast() {
  const { undoToast, undo, dismissUndo } = useGrove();

  useEffect(() => {
    if (!undoToast) return;
    const t = window.setTimeout(dismissUndo, TOAST_MS);
    return () => window.clearTimeout(t);
  }, [undoToast, dismissUndo]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {undoToast && (
        <div className="toast" key={undoToast.id}>
          <span>{undoToast.message}</span>
          <button type="button" className="toast-undo" onClick={undo}>
            Undo
          </button>
          <button
            type="button"
            className="toast-close"
            onClick={dismissUndo}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
