import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrove } from '../context/useGrove';
import type { Priority } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string | null;
  defaultDueDate?: string | null;
}

export function NewTaskModal({
  open,
  onClose,
  defaultProjectId = null,
  defaultDueDate = null,
}: Props) {
  const { addTask, projects } = useGrove();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [dueDate, setDueDate] = useState(defaultDueDate ?? '');
  const [priority, setPriority] = useState<Priority>('medium');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const task = addTask({
      title: title.trim(),
      projectId: projectId || null,
      dueDate: dueDate || null,
      priority,
    });
    setTitle('');
    setProjectId(defaultProjectId ?? '');
    setDueDate(defaultDueDate ?? '');
    setPriority('medium');
    onClose();
    navigate(`/task/${task.id}`);
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="new-task-title"
      >
        <h3 id="new-task-title">❧ Plant a new task</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nt-title">Title</label>
            <input
              id="nt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs tending?"
              autoFocus
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nt-project">Project</label>
              <select
                id="nt-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
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
              <label htmlFor="nt-priority">Priority</label>
              <select
                id="nt-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="nt-due">Due date</label>
            <input
              id="nt-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
