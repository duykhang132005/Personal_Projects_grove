import { Link } from 'react-router-dom';
import type { Task, Project } from '../types';
import { useGrove } from '../context/GroveContext';
import { formatDue, isOverdue, priorityLabel, statusLabel } from '../utils/format';

interface Props {
  task: Task;
  showProject?: boolean;
}

export function TaskItem({ task, showProject = true }: Props) {
  const { updateTask, getProject } = useGrove();
  const project: Project | undefined = task.projectId
    ? getProject(task.projectId)
    : undefined;
  const due = formatDue(task);
  const overdue = isOverdue(task);

  function toggleDone(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    updateTask(task.id, {
      status: task.status === 'done' ? 'todo' : 'done',
    });
  }

  return (
    <Link
      to={`/task/${task.id}`}
      className={`task-item${task.status === 'done' ? ' done' : ''}`}
    >
      <button
        type="button"
        className={`task-check${task.status === 'done' ? ' checked' : ''}`}
        onClick={toggleDone}
        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark done'}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className={`badge badge-priority-${task.priority}`}>
            {priorityLabel(task.priority)}
          </span>
          <span className={`badge badge-status-${task.status}`}>
            {statusLabel(task.status)}
          </span>
          {showProject && project && (
            <span className="badge badge-project">
              {project.emoji} {project.name}
            </span>
          )}
          {due && (
            <span
              className="badge badge-date"
              style={overdue ? { color: 'var(--urgent)', fontWeight: 700 } : undefined}
            >
              {overdue ? '⚠ ' : '📅 '}
              {due}
            </span>
          )}
          {task.tags.slice(0, 3).map((t) => (
            <span key={t} className="badge badge-tag">
              {t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
