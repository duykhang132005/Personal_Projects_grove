import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGrove } from '../context/useGrove';
import { UndoToast } from './UndoToast';
import { NewTaskModal } from './NewTaskModal';
import { ShortcutHelp } from './ShortcutHelp';
import { todayKey } from '../utils/garden';

interface QuickAddDefaults {
  projectId: string | null;
  dueDate: string | null;
}

/** Same defaults the page "+ New task" buttons use, picked from the current route. */
function quickAddDefaults(
  pathname: string,
  search: string,
  hasProject: (id: string) => boolean
): QuickAddDefaults {
  if (pathname === '/' || pathname === '/calendar') {
    return { projectId: null, dueDate: todayKey() };
  }
  // Projects detail (?project=id) and the List project filter (?project=id)
  const project = new URLSearchParams(search).get('project');
  if ((pathname === '/projects' || pathname === '/list') && project && hasProject(project)) {
    return { projectId: project, dueDate: null };
  }
  return { projectId: null, dueDate: null };
}

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
  const { getProject } = useGrove();
  const location = useLocation();
  const navigate = useNavigate();
  // Defaults for the shortcut popup; null while it is closed
  const [quickAdd, setQuickAdd] = useState<QuickAddDefaults | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const closeQuickAdd = useCallback(() => setQuickAdd(null), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  // Global shortcuts: "n" opens New task (with page defaults), "/" focuses List search, "?" opens help
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isNew = (e.key === 'n' || e.key === 'N') && !e.shiftKey;
      const isHelp = e.key === '?';
      const isSearch = e.key === '/';
      if (!isNew && !isHelp && !isSearch) return;
      if (e.repeat || e.isComposing) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Any open dialog (page popups included) keeps the keyboard
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      if (isNew) {
        setQuickAdd(
          quickAddDefaults(location.pathname, location.search, (id) => Boolean(getProject(id)))
        );
      } else if (isSearch) {
        const box = document.getElementById('list-search');
        if (location.pathname === '/list' && box) box.focus();
        else navigate({ pathname: '/list', search: location.pathname === '/list' ? location.search : '' }, { state: { focusSearch: true } });
      } else {
        setHelpOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, location.search, getProject, navigate]);

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
            onClick={() => setHelpOpen(true)}
            aria-keyshortcuts="?"
          >
            Shortcuts <kbd aria-hidden>?</kbd>
          </button>
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
      <NewTaskModal
        open={quickAdd !== null}
        onClose={closeQuickAdd}
        defaultProjectId={quickAdd?.projectId ?? null}
        defaultDueDate={quickAdd?.dueDate ?? null}
      />
      <ShortcutHelp open={helpOpen} onClose={closeHelp} />
    </div>
  );
}
