import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGrove } from '../context/useGrove';
import { useToday } from '../hooks/useToday';
import { GardenPlantPlot } from '../components/GardenPlantPlot';
import type { ArchivedPlant } from '../types';
import {
  DAILY_TASK_XP_CAP,
  STREAK_BONUS_CAP,
  STREAK_BONUS_PER_WEEK,
  WATER_XP,
  isWilted,
  parseDay,
  stageForXp,
  thisMonthPlants,
  wateredToday,
  weekStartKey,
} from '../utils/garden';

export function Garden() {
  const { garden, waterPlant } = useGrove();
  const [rulesOpen, setRulesOpen] = useState(false);
  // Re-renders when the local date changes, so watered / wilted state resets at midnight
  const today = useToday();
  const alreadyWatered = wateredToday(garden.lastWateredDate);
  const wilted = isWilted(garden.lastWateredDate) && !alreadyWatered;
  const taskXpToday = garden.taskXpByDay[today] ?? 0;
  const currentStreak = garden.currentStreak ?? 0;
  const bestStreak = garden.bestStreak ?? 0;
  const { stage, next, xpIntoStage, xpForNext, progress } = useMemo(
    () => stageForXp(garden.weekXp),
    [garden.weekXp]
  );
  const todayDate = parseDay(today);
  const monthPlants = thisMonthPlants(garden.weeklyPlants ?? [], todayDate);
  const currentPlant: ArchivedPlant = {
    weekKey: garden.weekKey,
    weekStart: garden.weekStart ?? weekStartKey(todayDate),
    weekXp: garden.weekXp,
    stageId: stage.id,
  };

  function handleWater() {
    waterPlant();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">Garden</h2>
          <p className="subtitle">
            Grow a plant each week. Water and finish tasks to keep a streak, and keep a monthly bed of what you grew.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/emporium" className="btn btn-secondary">
            Emporium
          </Link>
        </div>
      </div>

      <div className="garden-layout">
        <section className={`card card-elevated garden-plant-card${wilted ? ' wilted' : ''}`}>
          <div className="garden-week-label">Week {garden.weekKey}</div>
          <div
            className={`garden-plant-visual stage-${stage.id}${wilted ? ' is-wilted' : ''}`}
            aria-hidden
          >
            <div className="garden-soil" />
            <div className="garden-emoji">{stage.emoji}</div>
            {wilted && <div className="garden-wilt-badge">Needs water</div>}
          </div>
          <h3 className="garden-stage-name">{stage.name}</h3>
          <p className="garden-stage-sub">
            {garden.weekXp} XP this week
            {next
              ? ` · ${xpForNext} XP to ${next.name}`
              : ' · max stage reached'}
          </p>

          <div className="garden-xp-bar" role="progressbar" aria-label="Weekly XP progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="garden-xp-bar-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="garden-xp-bar-meta">
            {next
              ? `${xpIntoStage} / ${next.minXp - stage.minXp} XP toward ${next.name}`
              : 'Ancient grove. Keep watering for next week'}
          </div>

          <button
            type="button"
            className={`btn ${alreadyWatered ? 'btn-ghost' : 'btn-primary'} garden-water-btn`}
            onClick={handleWater}
            disabled={alreadyWatered}
          >
            {alreadyWatered ? 'Watered today ✓' : `Water the plant (+${WATER_XP} XP)`}
          </button>
          {alreadyWatered ? (
            <p className="garden-hint">Come back tomorrow for another drink.</p>
          ) : wilted ? (
            <p className="garden-hint garden-hint-wilt">
              Looking thirsty. Water to perk it up (cosmetic until you water).
            </p>
          ) : (
            <p className="garden-hint">Once per local day. Water XP does not use the task XP cap.</p>
          )}
        </section>

        <section className="card garden-stats-card">
          <h3 className="leaf-accent">This week</h3>
          <ul className="garden-stat-list">
            <li>
              <span className="label">Plant stage</span>
              <span className="value">
                {stage.emoji} {stage.name}
              </span>
            </li>
            <li>
              <span className="label">Weekly XP</span>
              <span className="value">{garden.weekXp}</span>
            </li>
            <li>
              <span className="label">Current streak</span>
              <span className="value">
                {currentStreak} {currentStreak === 1 ? 'week' : 'weeks'}
              </span>
            </li>
            <li>
              <span className="label">Best streak</span>
              <span className="value">
                {bestStreak} {bestStreak === 1 ? 'week' : 'weeks'}
              </span>
            </li>
            <li>
              <span className="label">Today&apos;s task XP</span>
              <span className="value">
                {taskXpToday} / {DAILY_TASK_XP_CAP}
              </span>
            </li>
            <li>
              <span className="label">Water</span>
              <span className="value">
                {alreadyWatered
                  ? 'Done for today'
                  : wilted
                    ? 'Wilted, needs water'
                    : 'Ready to water'}
              </span>
            </li>
            <li>
              <span className="label">Last watered</span>
              <span className="value">{garden.lastWateredDate ?? 'Never'}</span>
            </li>
          </ul>

          <div className="garden-rules">
            <button
              type="button"
              className="btn btn-ghost btn-sm garden-rules-toggle"
              aria-expanded={rulesOpen}
              aria-controls="garden-rules-panel"
              id="garden-rules-toggle"
              onClick={() => setRulesOpen((open) => !open)}
            >
              <span aria-hidden>{rulesOpen ? '▾' : '▸'}</span>
              How does the garden work?
            </button>
            <div
              id="garden-rules-panel"
              className={`garden-rules-panel${rulesOpen ? ' is-open' : ''}`}
              role="region"
              aria-labelledby="garden-rules-toggle"
              hidden={!rulesOpen}
            >
              <ul>
                <li>
                  Water once per day: <strong>+{WATER_XP} XP</strong> (not capped).
                </li>
                <li>
                  Completing a task: low 5 / medium 10 / high 15 / urgent 20.
                </li>
                <li>
                  Created less than 2 minutes before done → half XP (floored).
                </li>
                <li>
                  Task XP capped at <strong>{DAILY_TASK_XP_CAP}/day</strong>. If the
                  cap awards 0, the task is still marked granted (no retry later).
                </li>
                <li>
                  Each task only awards XP once, even if you undo it and mark it done again.
                </li>
                <li>Week XP resets every Monday (local week). The finished plant is kept in this month&apos;s bed.</li>
                <li>
                  A week counts toward the streak when you water at least once and earn some task XP. Missing a week resets the current streak.
                </li>
                <li>
                  Streak bonus: +{STREAK_BONUS_PER_WEEK} XP per streak week, capped at +{STREAK_BONUS_CAP}, granted once when the week first qualifies. It does not use the task XP cap.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section className="garden-bed" aria-labelledby="garden-bed-title">
        <h3 id="garden-bed-title" className="leaf-accent">
          This month&apos;s bed
        </h3>
        <p className="garden-bed-lead">
          Archived plants from this month, plus the one growing now. Earlier months are in the{' '}
          <Link to="/emporium">Emporium</Link>.
        </p>
        <div className="garden-bed-row">
          {monthPlants.map((plant) => (
            <GardenPlantPlot key={plant.weekKey} plant={plant} />
          ))}
          <GardenPlantPlot plant={currentPlant} growing />
        </div>
      </section>
    </div>
  );
}