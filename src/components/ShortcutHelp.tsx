import { useRef } from 'react';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'N', label: 'New task' },
  { keys: '/', label: 'Search task titles in List (keeps the current project filter)' },
  { keys: '?', label: 'Show this help' },
  { keys: 'Esc', label: 'Close a dialog, or clear the search box' },
];

/** Small keyboard help panel; mounted only while open. */
export function ShortcutHelp({ open, onClose }: Props) {
  if (!open) return null;
  return <ShortcutHelpDialog onClose={onClose} />;
}

function ShortcutHelpDialog({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(containerRef, onClose);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        ref={containerRef}
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
        <p className="shortcut-note">Shortcuts are ignored while you type in a field, while a dialog is open, or with Ctrl, Alt or Cmd held.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
