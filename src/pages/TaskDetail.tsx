import { useNavigate, useParams, Link } from 'react-router-dom';
import { useGrove } from '../context/useGrove';
import { uid } from '../utils/id';
import { taskProgress } from '../utils/format';
import type {
  BreakdownSection,
  MiniStep,
  Priority,
  Status,
  TaskLink,
} from '../types';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTask, updateTask, deleteTask, projects } = useGrove();
  const task = id ? getTask(id) : undefined;

  if (!task) {
    return (
      <div className="empty card">
        <div className="leaf">🌵</div>
        <p>Task not found — it may have been cleared away.</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Today
        </Link>
      </div>
    );
  }

  const progress = taskProgress(task);

  function patch(partial: Parameters<typeof updateTask>[1]) {
    updateTask(task!.id, partial);
  }

  function addBreakdown() {
    const section: BreakdownSection = {
      id: uid('bd'),
      title: 'New section',
      steps: [],
    };
    patch({ breakdowns: [...task!.breakdowns, section] });
  }

  function updateBreakdown(bdId: string, title: string) {
    patch({
      breakdowns: task!.breakdowns.map((b) =>
        b.id === bdId ? { ...b, title } : b
      ),
    });
  }

  function removeBreakdown(bdId: string) {
    patch({ breakdowns: task!.breakdowns.filter((b) => b.id !== bdId) });
  }

  function addStep(bdId: string) {
    const step: MiniStep = { id: uid('step'), title: '', completed: false };
    patch({
      breakdowns: task!.breakdowns.map((b) =>
        b.id === bdId ? { ...b, steps: [...b.steps, step] } : b
      ),
    });
  }

  function updateStep(bdId: string, stepId: string, partial: Partial<MiniStep>) {
    patch({
      breakdowns: task!.breakdowns.map((b) =>
        b.id === bdId
          ? {
              ...b,
              steps: b.steps.map((s) =>
                s.id === stepId ? { ...s, ...partial } : s
              ),
            }
          : b
      ),
    });
  }

  function removeStep(bdId: string, stepId: string) {
    patch({
      breakdowns: task!.breakdowns.map((b) =>
        b.id === bdId
          ? { ...b, steps: b.steps.filter((s) => s.id !== stepId) }
          : b
      ),
    });
  }

  function addLink() {
    const link: TaskLink = { id: uid('link'), label: '', url: '' };
    patch({ links: [...task!.links, link] });
  }

  function updateLink(linkId: string, partial: Partial<TaskLink>) {
    patch({
      links: task!.links.map((l) =>
        l.id === linkId ? { ...l, ...partial } : l
      ),
    });
  }

  function removeLink(linkId: string) {
    patch({ links: task!.links.filter((l) => l.id !== linkId) });
  }

  function handleTags(raw: string) {
    const tags = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    patch({ tags });
  }

  function handleDelete() {
    if (confirm('Delete this task permanently?')) {
      deleteTask(task!.id);
      navigate('/list');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(-1)}
            style={{ marginBottom: '0.5rem', paddingLeft: 0 }}
          >
            ← Back
          </button>
          <input
            className="input-title"
            value={task.title}
            onChange={(e) => patch({ title: e.target.value })}
            aria-label="Task title"
          />
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-section">
            <h3>❧ Description</h3>
            <textarea
              value={task.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What is this about?"
              rows={3}
              style={{ width: '100%' }}
            />
          </div>

          <div className="detail-section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h3 style={{ margin: 0 }}>🌿 Breakdown</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addBreakdown}>
                + Section
              </button>
            </div>
            {progress.total > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--earth)' }}>
                  {progress.done} / {progress.total} steps
                </span>
                <div className="progress-bar">
                  <div
                    style={{
                      width: `${(progress.done / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {task.breakdowns.length === 0 && (
              <p style={{ color: 'var(--earth)', fontSize: '0.9rem' }}>
                Break the work into sections and mini-steps.
              </p>
            )}
            {task.breakdowns.map((bd) => (
              <div key={bd.id} className="breakdown-block">
                <div className="breakdown-header">
                  <input
                    type="text"
                    value={bd.title}
                    onChange={(e) => updateBreakdown(bd.id, e.target.value)}
                    aria-label="Section title"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeBreakdown(bd.id)}
                    aria-label="Remove section"
                  >
                    ✕
                  </button>
                </div>
                {bd.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`step-row${step.completed ? ' completed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={step.completed}
                      onChange={(e) =>
                        updateStep(bd.id, step.id, {
                          completed: e.target.checked,
                        })
                      }
                      aria-label="Toggle step"
                    />
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) =>
                        updateStep(bd.id, step.id, { title: e.target.value })
                      }
                      placeholder="Mini-step…"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeStep(bd.id, step.id)}
                      aria-label="Remove step"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => addStep(bd.id)}
                  style={{ marginTop: '0.35rem' }}
                >
                  + Mini-step
                </button>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h3 style={{ margin: 0 }}>🔗 Links</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLink}>
                + Link
              </button>
            </div>
            {task.links.length === 0 && (
              <p style={{ color: 'var(--earth)', fontSize: '0.9rem' }}>
                Attach related URLs (docs, portals, sheets).
              </p>
            )}
            {task.links.map((link) => (
              <div key={link.id} className="link-row">
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateLink(link.id, { label: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, { url: e.target.value })}
                />
                {link.url && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    Open
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeLink(link.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <h3>📝 Notes</h3>
            <textarea
              value={task.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Scratch pad, reminders, thoughts…"
              rows={5}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <aside className="detail-sidebar">
          <div className="card">
            <div className="form-group">
              <label htmlFor="td-status">Status</label>
              <select
                id="td-status"
                value={task.status}
                onChange={(e) => patch({ status: e.target.value as Status })}
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="td-priority">Priority</label>
              <select
                id="td-priority"
                value={task.priority}
                onChange={(e) =>
                  patch({ priority: e.target.value as Priority })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="td-project">Project</label>
              <select
                id="td-project"
                value={task.projectId ?? ''}
                onChange={(e) =>
                  patch({ projectId: e.target.value || null })
                }
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="td-due">Due date</label>
              <input
                id="td-due"
                type="date"
                value={task.dueDate ?? ''}
                onChange={(e) =>
                  patch({ dueDate: e.target.value || null })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="td-time">Due time</label>
              <input
                id="td-time"
                type="time"
                value={task.dueTime ?? ''}
                onChange={(e) =>
                  patch({ dueTime: e.target.value || null })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="td-tags">Tags</label>
              <input
                id="td-tags"
                type="text"
                value={task.tags.join(', ')}
                onChange={(e) => handleTags(e.target.value)}
                placeholder="comma, separated"
              />
              <div className="tags-input-row" style={{ marginTop: '0.4rem' }}>
                {task.tags.map((t) => (
                  <span key={t} className="badge badge-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
