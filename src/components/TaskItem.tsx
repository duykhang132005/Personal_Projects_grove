import { Link } from 'react-router-dom';
import type { Task, Project } from '../types';
import { useGrove } from '../context/useGrove';
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

  function toggleDone() {
    updateTask(task.id, {
      status: task.status === 'done' ? 'todo' : 'done',
    });
  }

  return (
    <div className={`task-item${task.status === 'done' ? ' done' : ''}`}>
      <button
        type="button"
        className={`task-check${task.status === 'done' ? ' checked' : ''}`}
        onClick={toggleDone}
        aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark done'}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>
      <div className="task-body">
        {/* Stretched link: its ::after covers the row so the whole card opens the task */}
        <Link to={`/task/${task.id}`} className="task-title task-link">
          {task.title}
        </Link>
        <div className="task-meta">
          <span className={`badge badge-priority-${task.priority}`}>
            {priorityLabel(task.priority)}
          </span>
          <span className={`badge badge-status-${overdue ? 'overdue' : task.status}`}>
            {overdue
              ? task.status === 'in-progress'
                ? 'Overdue (in progress)'
                : 'Overdue'
              : statusLabel(task.status)}
          </span>
          {showProject && project && (
            <span className="badge badge-project">
              {project.emoji} {project.name}
            </span>
          )}
          {due && (
            <span className="badge badge-date">
              {'📅 '}
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
    </div>
  );
}
