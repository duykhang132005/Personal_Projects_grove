import { NavLink, Outlet } from 'react-router-dom';
import { useRef } from 'react';
import { useGrove } from '../context/useGrove';

const links = [
  { to: '/', label: 'Today', icon: '☀', end: true },
  { to: '/calendar', label: 'Calendar', icon: '📅', end: false },
  { to: '/list', label: 'List', icon: '☰', end: false },
  { to: '/projects', label: 'Projects', icon: '🌳', end: false },
];

export function Layout() {
  const { exportData, importData, resetData } = useGrove();
  const fileRef = useRef<HTMLInputElement>(null);

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
        alert('Could not import that file. Make sure it is a Grove JSON export.');
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
            onClick={() => {
              if (confirm('Reset to sample data? Your current tasks will be replaced.')) {
                resetData();
              }
            }}
          >
            Reset sample
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
