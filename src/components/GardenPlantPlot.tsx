import type { ArchivedPlant } from '../types';
import { format } from 'date-fns';
import { parseDay, stageForXp, stageFromId } from '../utils/garden';

interface Props {
  plant: ArchivedPlant;
  growing?: boolean;
}

/** Compact plant used in the monthly bed and the Emporium, matching Garden visuals. */
export function GardenPlantPlot({ plant, growing = false }: Props) {
  const stage = growing ? stageForXp(plant.weekXp).stage : stageFromId(plant.stageId);
  const weekLabel = growing ? 'This week' : format(parseDay(plant.weekStart), 'MMM d');

  return (
    <article className={`garden-bed-plant${growing ? ' is-growing' : ''}`}>
      <div
        className={`garden-plant-visual garden-plant-visual--bed stage-${stage.id}`}
        aria-hidden="true"
      >
        <div className="garden-soil" />
        <div className="garden-emoji">{stage.emoji}</div>
      </div>
      <h4 className="garden-bed-name">{stage.name}</h4>
      <p className="garden-bed-meta">
        <span className="garden-bed-week">{weekLabel}</span>
        <span className="garden-bed-xp">{plant.weekXp} XP</span>
      </p>
    </article>
  );
}