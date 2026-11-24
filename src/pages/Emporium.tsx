import { Link } from 'react-router-dom';
import { useGrove } from '../context/useGrove';
import { useToday } from '../hooks/useToday';
import { GardenPlantPlot } from '../components/GardenPlantPlot';
import { parseDay, pastMonthBeds } from '../utils/garden';

export function Emporium() {
  const { garden } = useGrove();
  const today = useToday();
  const beds = pastMonthBeds(garden.weeklyPlants ?? [], parseDay(today));
  const currentStreak = garden.currentStreak ?? 0;
  const bestStreak = garden.bestStreak ?? 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="leaf-accent">Emporium</h2>
          <p className="subtitle">Past months of weekly plants, newest first.</p>
        </div>
        <div className="header-actions">
          <Link to="/garden" className="btn btn-secondary">
            Back to Garden
          </Link>
        </div>
      </div>

      <section className="card garden-stats-card emporium-streak" aria-label="Streak">
        <ul className="garden-stat-list">
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
        </ul>
      </section>

      {beds.length === 0 ? (
        <div className="empty" role="status">
          <p>No past gardens yet</p>
          <p>Finish a month of weekly plants and they will appear here.</p>
        </div>
      ) : (
        <div className="emporium-months">
          {beds.map((bed) => (
            <section
              key={bed.monthKey}
              className="card emporium-month"
              aria-labelledby={`emporium-${bed.monthKey}`}
            >
              <header className="emporium-month-head">
                <h3 id={`emporium-${bed.monthKey}`} className="leaf-accent">
                  {bed.label}
                </h3>
                <p className="emporium-month-stats">
                  <span>
                    {bed.plants.length} {bed.plants.length === 1 ? 'plant' : 'plants'}
                  </span>
                  <span className="emporium-month-xp">{bed.totalXp} XP</span>
                </p>
              </header>
              <div className="garden-bed-row">
                {bed.plants.map((plant) => (
                  <GardenPlantPlot key={plant.weekKey} plant={plant} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}