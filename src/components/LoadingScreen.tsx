type Props = {
  /** Fade out when ready */
  fading?: boolean;
};

export function LoadingScreen({ fading = false }: Props) {
  return (
    <div
      className={`grove-loader${fading ? ' grove-loader--out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Grove"
    >
      <div className="grove-loader__glow" aria-hidden="true" />
      <div className="grove-loader__mark" aria-hidden="true">
        <span className="grove-loader__leaf">🌿</span>
      </div>
      <p className="grove-loader__title">Grove</p>
      <p className="grove-loader__sub">Rooting your plans…</p>
      <div className="grove-loader__bar" aria-hidden="true">
        <span className="grove-loader__bar-fill" />
      </div>
    </div>
  );
}
