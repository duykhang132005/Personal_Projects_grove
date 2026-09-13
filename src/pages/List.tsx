import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGrove } from '../context/useGrove';
import { TaskItem } from '../components/TaskItem';
import { NewTaskModal } from '../components/NewTaskModal';
import type { Status } from '../types';

type GroupBy = 'status' | 'project';

const STATUSES: Status[] = ['todo', 'in-progress', 'done'];

export function List() {
  const { tasks, projects } = useGrove();
  const [params, setParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const groupBy = (params.get('group') as GroupBy) || 'status';
  const filterProject = params.get('project');
  const filterStatus = params.get('status') as Status | null;

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filterProject) list = list.filter((t) => t.projectId === filterProject);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    return list.sort((a, b) => {
      const pri = { urgent: 0, high: 1, medium: 2, low: 3 };
      return pri[a.priority] - pri[b.priority];
    });
  }, [tasks, filterProject, filterStatus]);

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
            onClick={() => setModalOpen(true)}
          >
            + New task
          </button>
        </div>
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
