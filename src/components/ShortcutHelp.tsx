import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'N', label: 'New task' },
  { keys: '?', label: 'Show this help' },
  { keys: 'Esc', label: 'Close a dialog' },
];

/** Small keyboard help panel; mounted only while open. */
export function ShortcutHelp({ open, onClose }: Props) {
  if (!open) return null;
  return <ShortcutHelpDialog onClose={onClose} />;
}

function ShortcutHelpDialog({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Move focus in, and give it back to wherever it was on close
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        // Only one control inside, so keep focus on it
        e.preventDefault();
        closeRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal shortcut-help"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
      >
        <h3 id="shortcut-help-title">⌨ Keyboard shortcuts</h3>
        <dl className="shortcut-list">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="shortcut-row">
              <dt>
                <kbd>{s.keys}</kbd>
              </dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className="shortcut-note">Shortcuts are ignored while you type in a field.</p>
        <div className="modal-actions">
          <button ref={closeRef} type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
