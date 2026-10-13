// The Markets overview's line charts (story W12; 34-markets' `line` and `spark`): a series of closes, green when it
// ended up, red when down, neutral for a volatility series (where up is not good). Empty values are skipped.
const W = 600;

export function Line({ vals, label, height = 160, neutral = false, className = "plot" }: { vals: (number | null)[]; label: string; height?: number; neutral?: boolean; className?: string }) {
  const pts = vals.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  if (!pts.length) return null;
  const lo = Math.min(...pts.map((p) => p[1]));
  const hi = Math.max(...pts.map((p) => p[1]));
  const up = pts[pts.length - 1][1] >= pts[0][1];
  const xy = ([i, v]: readonly [number, number]) => `${((i / Math.max(1, vals.length - 1)) * W).toFixed(1)},${(height - 6 - ((v - lo) / (hi - lo || 1)) * (height - 12)).toFixed(1)}`;
  const stroke = neutral ? "var(--mb-chart-1)" : up ? "var(--mb-color-up)" : "var(--mb-color-down)";
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={label} className={className} style={{ height }}>
      <polyline points={pts.map(xy).join(" ")} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export const Spark = ({ vals, neutral }: { vals: (number | null)[]; neutral: boolean }) => (
  <span style={{ display: "inline-block", width: 90 }}><Line vals={vals} label="trend" height={28} neutral={neutral} className="spark" /></span>
);
