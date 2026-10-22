import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useGrove } from '../context/useGrove';
import { TaskItem } from '../components/TaskItem';
import { NewTaskModal } from '../components/NewTaskModal';
import { useNow } from '../hooks/useNow';
import type { Status } from '../types';

type GroupBy = 'status' | 'project';

const STATUSES: Status[] = ['todo', 'in-progress', 'done'];

export function List() {
  const { tasks, projects } = useGrove();
  // Once-a-minute re-render so time-based Overdue badges in the list stay current
  useNow();
  const [params, setParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const groupBy = (params.get('group') as GroupBy) || 'status';
  const filterProject = params.get('project');
  const filterStatus = params.get('status') as Status | null;
  const query = params.get('q') ?? '';
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  // Local text keeps typing smooth; it follows the URL when ?q= changes elsewhere (Back, links)
  const [searchText, setSearchText] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setSearchText(query);
  }

  // The "/" shortcut from another page lands here with focusSearch set
  useEffect(() => {
    const state = location.state as { focusSearch?: boolean } | null;
    if (state?.focusSearch) searchRef.current?.focus();
  }, [location.state]);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filterProject) list = list.filter((t) => t.projectId === filterProject);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    const needle = query.trim().toLowerCase();
    if (needle) list = list.filter((t) => t.title.toLowerCase().includes(needle));
    return list.sort((a, b) => {
      const pri = { urgent: 0, high: 1, medium: 2, low: 3 };
      return pri[a.priority] - pri[b.priority];
    });
  }, [tasks, filterProject, filterStatus, query]);

  const groups = useMemo(() => {
    if (groupBy === 'status') {
      return STATUSES.map((s) => ({
        key: s,
        title:
          s === 'todo' ? 'To do' : s === 'in-progress' ? 'In progress' : 'Done',
        items: filtered.filter((t) => t.status === s),
      })).filter((g) => g.items.length > 0 || !filterStatus);
    }
    const byProj = projects.map((p) => ({
      key: p.id,
      title: `${p.emoji} ${p.name}`,
      items: filtered.filter((t) => t.projectId === p.id),
    }));
    const unassigned = filtered.filter((t) => !t.projectId);
    if (unassigned.length) {
      byProj.push({ key: 'none', title: '🍃 Unassigned', items: unassigned });
    }
    return byProj.filter((g) => g.items.length > 0 || filterProject === g.key);
  }, [groupBy, filtered, projects, filterStatus, filterProject]);

  function setGroup(g: GroupBy) {
    const next = new URLSearchParams(params);
    next.set('group', g);
    setParams(next);
  }

  function setProjectFilter(id: string | null) {
    const next = new URLSearchParams(params);
    if (id) next.set('project', id);
    else next.delete('project');
    setParams(next);
  }

  function setStatusFilter(s: Status | null) {
    const next = new URLSearchParams(params);
    if (s) next.set('status', s);
    else next.delete('status');
    setParams(next);
  }

  function setSearch(value: string) {
    setSearchText(value);
    setSyncedQuery(value);
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    // First Esc clears the text, the next one leaves the box
    if (searchText) setSearch('');
    else e.currentTarget.blur();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">List</h2>
          <p className="subtitle">Browse by project or status</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            title="New task (N)"
            aria-keyshortcuts="n"
            onClick={() => setModalOpen(true)}
          >
            + New task
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <label
          htmlFor="list-search"
          style={{ fontSize: '0.8rem', color: 'var(--earth)', fontWeight: 600 }}
        >
          Search:
        </label>
        <input
          ref={searchRef}
          id="list-search"
          className="list-search"
          type="search"
          placeholder="Task title (press /)"
          aria-keyshortcuts="/"
          autoComplete="off"
          value={searchText}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      <div className="filter-bar">
        <span style={{ fontSize: '0.8rem', color: 'var(--earth)', fontWeight: 600 }}>
          Group:
        </span>
        <button
          type="button"
          className={`filter-chip${groupBy === 'status' ? ' active' : ''}`}
          onClick={() => setGroup('status')}
        >
          Status
        </button>
        <button
          type="button"
          className={`filter-chip${groupBy === 'project' ? ' active' : ''}`}
          onClick={() => setGroup('project')}
        >
          Project
        </button>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--earth)',
            fontWeight: 600,
            marginLeft: '0.5rem',
          }}
        >
          Filter:
        </span>
        <button
          type="button"
          className={`filter-chip${!filterStatus ? ' active' : ''}`}
          onClick={() => setStatusFilter(null)}
        >
          All statuses
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`filter-chip${filterStatus === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'in-progress' ? 'In progress' : s === 'todo' ? 'To do' : 'Done'}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <button
          type="button"
          className={`filter-chip${!filterProject ? ' active' : ''}`}
          onClick={() => setProjectFilter(null)}
        >
          All projects
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`filter-chip${filterProject === p.id ? ' active' : ''}`}
            onClick={() => setProjectFilter(p.id)}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      {groups.length === 0 || filtered.length === 0 ? (
        <div className="empty card">
          <div className="leaf">🍂</div>
          <p>No tasks match these filters.</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} style={{ marginBottom: '1.75rem' }}>
            <h3 className="section-title">
              {g.title}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--earth)',
                  fontFamily: 'var(--font)',
                }}
              >
                ({g.items.length})
              </span>
            </h3>
            <div className="task-list">
              {g.items.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  showProject={groupBy !== 'project'}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultProjectId={filterProject}
      />
    </div>
  );
}
