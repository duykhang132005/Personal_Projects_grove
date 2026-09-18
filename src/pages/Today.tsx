import { useMemo, useState } from 'react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { useGrove } from '../context/useGrove';
import { TaskItem } from '../components/TaskItem';
import { NewTaskModal } from '../components/NewTaskModal';

export function Today() {
  const { tasks } = useGrove();
  const [modalOpen, setModalOpen] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { todayTasks, upcoming, overdue, inProgress, doneToday, openCount } =
    useMemo(() => {
      const open = tasks.filter((t) => t.status !== 'done');
      const todayTasks = open.filter(
        (t) => t.dueDate && isToday(parseISO(t.dueDate))
      );
      const overdue = open.filter((t) => {
        if (!t.dueDate) return false;
        const d = parseISO(t.dueDate);
        return isPast(d) && !isToday(d);
      });
      const upcoming = open
        .filter((t) => {
          if (!t.dueDate) return false;
          const d = parseISO(t.dueDate);
          return isTomorrow(d) || (!isToday(d) && !isPast(d));
        })
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
        .slice(0, 5);
      const inProgress = open.filter((t) => t.status === 'in-progress');
      const doneToday = tasks.filter(
        (t) =>
          t.status === 'done' &&
          t.updatedAt.slice(0, 10) === todayStr
      );
      return {
        todayTasks,
        upcoming,
        overdue,
        inProgress,
        doneToday,
        openCount: open.length,
      };
    }, [tasks, todayStr]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">
            {greeting}
          </h2>
          <p className="subtitle">
            {format(new Date(), 'EEEE, MMMM d')}. Tend what matters today
          </p>
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

      <div className="grid-stats">
        <div className="stat-card">
          <div className="label">Due today</div>
          <div className="value">{todayTasks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">In progress</div>
          <div className="value">{inProgress.length}</div>
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
              .sort((a, b) => (a.dueTime ?? '').localeCompare(b.dueTime ?? ''))
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
