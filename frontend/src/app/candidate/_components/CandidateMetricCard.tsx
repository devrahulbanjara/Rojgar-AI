'use client'

export type CandidateMetricTone = 'primary' | 'secondary' | 'success' | 'accent' | 'danger'

type CandidateMetricCardProps = {
  label: string
  value: number
  tone: CandidateMetricTone
  values: number[]
}

export function buildLinePath(
  values: number[],
  width: number,
  height: number,
  maxValue: number,
  padding?: { x?: number; y?: number },
): string {
  if (values.length === 0) return ''
  const padX = padding?.x ?? 0
  const padY = padding?.y ?? 0
  const drawableWidth = Math.max(width - padX * 2, 1)
  const drawableHeight = Math.max(height - padY * 2, 1)

  if (values.length === 1) {
    const y = height - padY - (values[0] / maxValue) * drawableHeight
    return `M ${padX} ${y} L ${width - padX} ${y}`
  }

  return values
    .map((value, index) => {
      const x = padX + (index / (values.length - 1)) * drawableWidth
      const y = height - padY - (value / maxValue) * drawableHeight
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

export function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  maxValue: number,
  padding?: { x?: number; y?: number },
): string {
  const padX = padding?.x ?? 0
  const padY = padding?.y ?? 0
  const linePath = buildLinePath(values, width, height, maxValue, padding)
  if (!linePath || values.length === 0) return ''
  return `${linePath} L ${width - padX} ${height - padY} L ${padX} ${height - padY} Z`
}

function getValueClassName(tone: CandidateMetricTone): string {
  if (tone === 'secondary') return 'stat-card__value candidate-dashboard__stat-value--warning'
  if (tone === 'danger') return 'stat-card__value candidate-dashboard__stat-value--danger'
  return 'stat-card__value'
}

function MetricSparkline({ values, tone }: { values: number[]; tone: CandidateMetricTone }) {
  const width = 88
  const height = 36
  const maxValue = Math.max(...values, 1)
  const padding = { x: 4, y: 5 }

  return (
    <svg
      className="dashboard-metric-card__sparkline"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
    >
      <path
        d={buildAreaPath(values, width, height, maxValue, padding)}
        className="dashboard-metric-card__sparklineArea"
      />
      <path
        d={buildLinePath(values, width, height, maxValue, padding)}
        className={`dashboard-metric-card__sparklineLine dashboard-metric-card__sparklineLine--${tone}`}
      />
    </svg>
  )
}

export default function CandidateMetricCard({
  label,
  value,
  tone,
  values,
}: CandidateMetricCardProps) {
  return (
    <div className="stat-card dashboard-metric-card">
      <div className="dashboard-metric-card__header">
        <div className="dashboard-metric-card__copy">
          <div className={getValueClassName(tone)}>{value}</div>
          <div className="stat-card__label">{label}</div>
        </div>
        <MetricSparkline values={values} tone={tone} />
      </div>
    </div>
  )
}
