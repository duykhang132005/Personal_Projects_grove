import { useState } from 'react';
import type { Recurrence } from '../types';
import {
  MAX_INTERVAL,
  RECURRENCE_OPTIONS,
  intervalUnit,
  isRecurrenceFreq,
} from '../utils/recurrence';

interface Props {
  /** Prefix for element ids, e.g. "nt" gives nt-repeat and nt-interval */
  idPrefix: string;
  value: Recurrence | undefined;
  onChange: (next: Recurrence | undefined) => void;
}

/** Repeat select plus an "Every N units" input shown when a repeat is chosen. */
export function RepeatFields({ idPrefix, value, onChange }: Props) {
  return (
    <div className="form-group">
      <label htmlFor={`${idPrefix}-repeat`}>Repeat</label>
      <select
        id={`${idPrefix}-repeat`}
        value={value?.freq ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(isRecurrenceFreq(v) ? { ...value, freq: v } : undefined);
        }}
      >
        <option value="">None</option>
        {RECURRENCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {value && <IntervalInput idPrefix={idPrefix} value={value} onChange={onChange} />}
    </div>
  );
}

interface IntervalProps {
  idPrefix: string;
  value: Recurrence;
  onChange: (next: Recurrence) => void;
}

function IntervalInput({ idPrefix, value, onChange }: IntervalProps) {
  const interval = value.interval ?? 1;
  // Draft text so the field can be cleared while typing; only valid numbers are saved
  const [draft, setDraft] = useState(String(interval));
  const [synced, setSynced] = useState(interval);
  if (synced !== interval) {
    setSynced(interval);
    setDraft(String(interval));
  }
  const unitId = `${idPrefix}-interval-unit`;

  return (
    <div className="repeat-interval">
      <label htmlFor={`${idPrefix}-interval`}>Every</label>
      <input
        id={`${idPrefix}-interval`}
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_INTERVAL}
        step={1}
        value={draft}
        aria-describedby={unitId}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (Number.isInteger(n) && n >= 1 && n <= MAX_INTERVAL) {
            onChange({ ...value, interval: n > 1 ? n : undefined });
          }
        }}
        onBlur={() => setDraft(String(interval))}
      />
      <span id={unitId}>{intervalUnit(value.freq, interval)}</span>
    </div>
  );
}
