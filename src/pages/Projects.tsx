import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGrove } from '../context/GroveContext';
import { TaskItem } from '../components/TaskItem';
import { NewTaskModal } from '../components/NewTaskModal';

const COLORS = ['#5a8f6b', '#7a9e6e', '#8b7355', '#6b9e8a', '#9a7b5a', '#5a7a8f'];
const EMOJIS = ['📚', '🎵', '🌿', '🍃', '🪴', '🌻', '🪺', '🪵'];

export function Projects() {
  const { projects, tasks, addProject, deleteProject, updateProject } = useGrove();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🪴');
  const [color, setColor] = useState(COLORS[0]);

  const selected = projects.find((p) => p.id === selectedId);

  const projectTasks = useMemo(
    () =>
      selectedId
        ? tasks
            .filter((t) => t.projectId === selectedId)
            .sort((a, b) => {
              if (a.status === 'done' && b.status !== 'done') return 1;
              if (b.status === 'done' && a.status !== 'done') return -1;
              return 0;
            })
        : [],
    [tasks, selectedId]
  );

  function counts(projectId: string) {
    const all = tasks.filter((t) => t.projectId === projectId);
    const open = all.filter((t) => t.status !== 'done').length;
    return { open, total: all.length };
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const p = addProject({
      name: name.trim(),
      description: description.trim(),
      emoji,
      color,
    });
    setName('');
    setDescription('');
    setCreating(false);
    setSelectedId(p.id);
  }

  if (selected) {
    const c = counts(selected.id);
    return (
      <div>
        <div className="page-header">
          <div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedId(null)}
              style={{ marginBottom: '0.5rem', paddingLeft: 0 }}
            >
              ← All projects
            </button>
            <h2>
              <span style={{ marginRight: '0.4rem' }}>{selected.emoji}</span>
              {selected.name}
            </h2>
            <p className="subtitle">{selected.description || 'No description'}</p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              + New task
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (
                  confirm(
                    `Delete project “${selected.name}”? Tasks will be unassigned.`
                  )
                ) {
                  deleteProject(selected.id);
                  setSelectedId(null);
                }
              }}
            >
              Delete project
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="pe-name">Name</label>
              <input
                id="pe-name"
                type="text"
                value={selected.name}
                onChange={(e) =>
                  updateProject(selected.id, { name: e.target.value })
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="pe-emoji">Emoji</label>
              <input
                id="pe-emoji"
                type="text"
                value={selected.emoji}
                onChange={(e) =>
                  updateProject(selected.id, { emoji: e.target.value })
                }
                maxLength={4}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            <label htmlFor="pe-desc">Description</label>
            <input
              id="pe-desc"
              type="text"
              value={selected.description}
              onChange={(e) =>
                updateProject(selected.id, { description: e.target.value })
              }
            />
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--earth)' }}>
            {c.open} open · {c.total} total
          </p>
        </div>

        <h3 className="section-title">Tasks</h3>
        {projectTasks.length === 0 ? (
          <div className="empty card">
            <div className="leaf">🌱</div>
            <p>No tasks in this grove yet.</p>
          </div>
        ) : (
          <div className="task-list">
            {projectTasks.map((t) => (
              <TaskItem key={t.id} task={t} showProject={false} />
            ))}
          </div>
        )}

        <NewTaskModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultProjectId={selected.id}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">Projects</h2>
          <p className="subtitle">Academics, Music, Life, and the rest of your grove</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCreating(true)}
          >
            + New project
          </button>
        </div>
      </div>

      <div className="project-grid">
        {projects.map((p) => {
          const c = counts(p.id);
          return (
            <button
              key={p.id}
              type="button"
              className="project-card"
              onClick={() => setSelectedId(p.id)}
              style={{ borderTop: `4px solid ${p.color}` }}
            >
              <div className="project-emoji">{p.emoji}</div>
              <h3>{p.name}</h3>
              <p>{p.description || '—'}</p>
              <div className="project-count">
                {c.open} open · {c.total} total
              </div>
              {c.total > 0 && (
                <div className="progress-bar">
                  <div
                    style={{
                      width: `${((c.total - c.open) / c.total) * 100}%`,
                      background: p.color,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--earth)' }}>
        Prefer the list view?{' '}
        <Link to="/list?group=project">Browse all tasks by project →</Link>
      </p>

      {creating && (
        <div
          className="modal-backdrop"
          onClick={() => setCreating(false)}
          role="presentation"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="new-proj-title"
          >
            <h3 id="new-proj-title">🌳 New project</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="np-name">Name</label>
                <input
                  id="np-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Academics"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="np-desc">Description</label>
                <input
                  id="np-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>Emoji</label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`filter-chip${emoji === em ? ' active' : ''}`}
                      onClick={() => setEmoji(em)}
                      style={{ fontSize: '1.1rem' }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={c}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c,
                        border:
                          color === c
                            ? '3px solid var(--soil)'
                            : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
