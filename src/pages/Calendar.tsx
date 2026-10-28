import { useEffect, useMemo, useState } from 'react';
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
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { useGrove } from '../context/useGrove';
import { NewTaskModal } from '../components/NewTaskModal';
import { useToday } from '../hooks/useToday';
import type { Task } from '../types';

type CalView = 'month' | 'week';

export function Calendar() {
  const { tasks, getProject } = useGrove();
  // Local day key; follows midnight and focus so the highlight and Today button stay current
  const today = useToday();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<CalView>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string | null>(null);
  // Day opened from a month cell's "+N more"; highlighted in week view until you navigate away
  const [focusDay, setFocusDay] = useState<string | null>(null);

  // After "+N more" swaps to week view, move keyboard focus onto that day's add button
  useEffect(() => {
    if (view !== 'week' || !focusDay) return;
    document
      .querySelector<HTMLButtonElement>(`[data-day="${focusDay}"] .cal-add`)
      ?.focus();
  }, [view, focusDay]);

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

  function showDay(day: Date) {
    setCursor(day);
    setView('week');
    setFocusDay(format(day, 'yyyy-MM-dd'));
  }

  function moreButton(day: Date, hidden: number) {
    const label = `Show ${hidden} more ${hidden === 1 ? 'task' : 'tasks'} on ${format(day, 'EEE, MMM d')}`;
    return (
      <button
        type="button"
        className="cal-more"
        aria-label={label}
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          showDay(day);
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        +{hidden} more
      </button>
    );
  }

  function addButton(day: Date) {
    const label = `Add task on ${format(day, 'EEE, MMM d')}`;
    return (
      <button
        type="button"
        className="cal-add"
        aria-label={label}
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          openNew(day);
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden>+</span>
      </button>
    );
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
            title="New task (N)"
            aria-keyshortcuts="n"
            onClick={() => {
              setModalDate(today);
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
          onClick={() => {
            setFocusDay(null);
            setCursor(view === 'month' ? subMonths(cursor, 1) : addDays(cursor, -7));
          }}
        >
          ←
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setFocusDay(null);
            setCursor(parseISO(today));
          }}
        >
          Today
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setFocusDay(null);
            setCursor(view === 'month' ? addMonths(cursor, 1) : addDays(cursor, 7));
          }}
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
            onClick={() => {
              setFocusDay(null);
              setView('week');
            }}
          >
            Week
          </button>
          <button
            type="button"
            className={view === 'month' ? 'active' : ''}
            onClick={() => {
              setFocusDay(null);
              setView('month');
            }}
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
                  format(day, 'yyyy-MM-dd') === today ? ' today' : ''
                }`}
                onDoubleClick={() => openNew(day)}
              >
                <div className="day-num">{format(day, 'd')}</div>
                {addButton(day)}
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
                {items.length > 3 && moreButton(day, items.length - 3)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="week-grid">
          {weekDays.map((day) => {
            const items = tasksOn(day);
            const key = format(day, 'yyyy-MM-dd');
            return (
              <div
                key={day.toISOString()}
                data-day={key}
                className={`week-day${key === today ? ' today' : ''}${
                  key === focusDay ? ' focused' : ''
                }`}
                onDoubleClick={() => openNew(day)}
              >
                <div className="week-day-header">{format(day, 'EEE')}</div>
                <div className="week-day-num">{format(day, 'd')}</div>
                {addButton(day)}
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
        Tip: use a day's + button, or double-click the day, to plant a task there.
      </p>

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDueDate={modalDate}
      />
    </div>
  );
}
