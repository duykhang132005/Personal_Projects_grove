import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { useGrove } from '../context/GroveContext';
import { NewTaskModal } from '../components/NewTaskModal';
import type { Task } from '../types';

type CalView = 'month' | 'week';

export function Calendar() {
  const { tasks, getProject } = useGrove();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<CalView>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string | null>(null);

  const datedTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && t.status !== 'done'),
    [tasks]
  );

  function tasksOn(day: Date): Task[] {
    return datedTasks.filter((t) => {
      try {
        return isSameDay(parseISO(t.dueDate!), day);
      } catch {
        return false;
      }
    });
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return eachDayOfInterval({ start, end: endOfWeek(cursor) });
  }, [cursor]);

  function openNew(day: Date) {
    setModalDate(format(day, 'yyyy-MM-dd'));
    setModalOpen(true);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">Calendar</h2>
          <p className="subtitle">See what is rooted in time</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setModalDate(format(new Date(), 'yyyy-MM-dd'));
              setModalOpen(true);
            }}
          >
            + New task
          </button>
        </div>
      </div>

      <div className="cal-toolbar">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            setCursor(view === 'month' ? subMonths(cursor, 1) : addDays(cursor, -7))
          }
        >
          ←
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setCursor(new Date())}
        >
          Today
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() =>
            setCursor(view === 'month' ? addMonths(cursor, 1) : addDays(cursor, 7))
          }
        >
          →
        </button>
        <h3>
          {view === 'month'
            ? format(cursor, 'MMMM yyyy')
            : `Week of ${format(startOfWeek(cursor), 'MMM d')}`}
        </h3>
        <div className="view-toggle" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className={view === 'week' ? 'active' : ''}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="cal-scroll">
      {view === 'month' ? (
        <div className="month-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="month-dow">
              {d}
            </div>
          ))}
          {monthDays.map((day) => {
            const items = tasksOn(day);
            const outside = !isSameMonth(day, cursor);
            return (
              <div
                key={day.toISOString()}
                className={`month-cell${outside ? ' outside' : ''}${
                  isToday(day) ? ' today' : ''
                }`}
                onDoubleClick={() => openNew(day)}
              >
                <div className="day-num">{format(day, 'd')}</div>
                {items.slice(0, 3).map((t) => {
                  const proj = t.projectId ? getProject(t.projectId) : undefined;
                  return (
                    <Link
                      key={t.id}
                      to={`/task/${t.id}`}
                      className="cal-event"
                      style={
                        proj
                          ? { borderLeftColor: proj.color }
                          : undefined
                      }
                      title={t.title}
                    >
                      {t.dueTime ? `${t.dueTime} ` : ''}
                      {t.title}
                    </Link>
                  );
                })}
                {items.length > 3 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--earth)' }}>
                    +{items.length - 3} more
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="week-grid">
          {weekDays.map((day) => {
            const items = tasksOn(day);
            return (
              <div
                key={day.toISOString()}
                className={`week-day${isToday(day) ? ' today' : ''}`}
                onDoubleClick={() => openNew(day)}
              >
                <div className="week-day-header">{format(day, 'EEE')}</div>
                <div className="week-day-num">{format(day, 'd')}</div>
                <div className="task-list">
                  {items.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--earth)' }}>
                      Clear
                    </p>
                  )}
                  {items.map((t) => {
                    const proj = t.projectId ? getProject(t.projectId) : undefined;
                    return (
                      <Link
                        key={t.id}
                        to={`/task/${t.id}`}
                        className="cal-event"
                        style={
                          proj ? { borderLeftColor: proj.color } : undefined
                        }
                      >
                        {t.dueTime && <strong>{t.dueTime}</strong>} {t.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--earth)' }}>
        Tip: double-click a day to plant a task there.
      </p>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDueDate={modalDate}
      />
    </div>
  );
}
