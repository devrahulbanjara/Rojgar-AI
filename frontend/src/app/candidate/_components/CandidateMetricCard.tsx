'use client'

export type CandidateMetricTone = 'primary' | 'secondary' | 'success' | 'accent' | 'danger'

type CandidateMetricCardProps = {
  label: string
  value: number
  tone: CandidateMetricTone
}

function getValueClassName(tone: CandidateMetricTone): string {
  if (tone === 'secondary') return 'stat-card__value candidate-dashboard__stat-value--warning'
  if (tone === 'danger') return 'stat-card__value candidate-dashboard__stat-value--danger'
  return 'stat-card__value'
}

export default function CandidateMetricCard({ label, value, tone }: CandidateMetricCardProps) {
  return (
    <div className="stat-card dashboard-metric-card">
      <div className="dashboard-metric-card__copy">
        <div className={getValueClassName(tone)}>{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  )
}
