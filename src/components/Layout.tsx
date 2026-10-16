import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useGrove } from '../context/useGrove';
import { UndoToast } from './UndoToast';
import { NewTaskModal } from './NewTaskModal';

/** True when a key press should go to a form field instead of a shortcut */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !==
      null
  );
}

const links = [
  { to: '/', label: 'Today', icon: '☀', end: true },
  { to: '/calendar', label: 'Calendar', icon: '📅', end: false },
  { to: '/list', label: 'List', icon: '☰', end: false },
  { to: '/projects', label: 'Projects', icon: '🌳', end: false },
  { to: '/garden', label: 'Garden', icon: '🌱', end: false },
];

export function Layout() {
  const { exportData, importData, resetDataWithUndo, showNotice } = useGrove();
  const fileRef = useRef<HTMLInputElement>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Global "n" shortcut: opens the New task popup from any page
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'n' && e.key !== 'N') return;
      if (e.repeat || e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      // Any open dialog (page popups included) keeps the keyboard
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      setQuickAddOpen(true);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grove-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(String(reader.result));
      } catch {
        showNotice(
          'Could not import that file. Make sure it is a Grove JSON export.',
          'error'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            🌲
          </div>
          <div className="brand-text">
            <h1>Grove</h1>
            <span>Grow your days</span>
          </div>
        </div>
        <ul className="nav-list">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
              >
                <span className="icon" aria-hidden>
                  {l.icon}
                </span>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleExport}>
            Export JSON
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={resetDataWithUndo}
          >
            Reset sample
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      <UndoToast />
      <NewTaskModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
