'use client'

export type DonutSegment = {
  label: string
  value: number
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'blue' | 'accent' | 'gray'
}

type DonutChartProps = {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
  showLegend?: boolean
  title?: string
}

export default function DonutChart({
  segments,
  size = 140,
  strokeWidth = 22,
  showLegend = true,
  title,
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const C = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  const GAP = total > 1 ? 1.5 : 0
  let cumulative = 0
  const arcs = segments.map((seg) => {
    const rawArcLen = total > 0 ? (seg.value / total) * C : 0
    const arcLen = Math.max(rawArcLen - GAP, 0)
    const offset = C - cumulative
    cumulative += rawArcLen
    return { ...seg, arcLen, offset }
  })

  return (
    <div className="dashboard-donut">
      <svg
        className="dashboard-donut__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={title ?? 'Donut chart'}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f2" strokeWidth={strokeWidth} />
        {total > 0 &&
          arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.arcLen} ${C}`}
              strokeDashoffset={arc.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className={`dashboard-donut__segment--${arc.tone}`}
              strokeLinecap="butt"
            />
          ))}
      </svg>

      {title && <div className="dashboard-donut__label">{title}</div>}

      {showLegend && (
        <div className="dashboard-donut__legend">
          {segments.map((seg) => (
            <div key={seg.label} className="dashboard-donut__legend-item">
              <span
                className={`dashboard-donut__legend-dot dashboard-donut__legend-dot--${seg.tone}`}
              />
              <span>{seg.label}</span>
              <strong>{seg.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
