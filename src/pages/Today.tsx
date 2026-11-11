import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useGrove } from '../context/useGrove';
import { TaskItem } from '../components/TaskItem';
import { NewTaskModal } from '../components/NewTaskModal';
import { useToday } from '../hooks/useToday';
import { useNow } from '../hooks/useNow';
import { classifyTodaySections } from '../lib/todaySections';

export function Today() {
  const { tasks } = useGrove();
  const [modalOpen, setModalOpen] = useState(false);
  // Local day key: changes at local midnight (and is re-checked on focus), so the
  // sections, counts, and header below recompute while the app stays open.
  const todayStr = useToday();
  // Once-a-minute re-render so the greeting and time-based Overdue badges stay current
  const now = useNow();

  const { todayTasks, upcoming, overdue, inProgress, inProgressCount, doneToday, openCount } =
    useMemo(
      () => classifyTodaySections(tasks, todayStr),
      // isOverdue reads the clock internally, so the minute tick must invalidate this memo.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [tasks, todayStr, now],
    );

  // Cheap, so recomputed on every render (including the minute tick above)
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">
            {greeting}
          </h2>
          <p className="subtitle">
            {format(parseISO(todayStr), 'EEEE, MMMM d')}. Tend what matters today
          </p>
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

      <div className="grid-stats">
        <div className="stat-card">
          <div className="label">Due today</div>
          <div className="value">{todayTasks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">In progress</div>
          <div className="value">{inProgressCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Overdue</div>
          <div className="value" style={{ color: overdue.length ? 'var(--urgent)' : undefined }}>
            {overdue.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Open total</div>
          <div className="value">{openCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Done today</div>
          <div className="value">{doneToday.length}</div>
        </div>
      </div>

      {overdue.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title">⚠ Overdue</h3>
          <div className="task-list">
            {overdue.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title">☀ Today</h3>
        {todayTasks.length === 0 ? (
          <div className="empty card">
            <div className="leaf">🍃</div>
            <p>Nothing due today. Enjoy the quiet grove.</p>
          </div>
        ) : (
          <div className="task-list">
            {todayTasks
              .map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
          </div>
        )}
      </section>

      {inProgress.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title">🌿 In progress</h3>
          <div className="task-list">
            {inProgress.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title">🌱 Coming up</h3>
          <div className="task-list">
            {upcoming.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        </section>
      )}

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDueDate={todayStr}
      />
    </div>
  );
}
