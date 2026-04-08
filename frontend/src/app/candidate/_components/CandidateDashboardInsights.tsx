'use client'

import type { CSSProperties } from 'react'

import {
  type CandidateDashboardAnalyticsData,
  type CandidateDashboardAnalyticsTimeseriesPoint,
} from '@/store/services/dashboardApi'

type RangeKey = '7d' | '30d' | '90d'

type CandidateDashboardReadiness = {
  completion: number
  targetRoles: number
  skills: number
  isOpenToWork: boolean
}

type CandidateDashboardInsightsProps = {
  analytics: CandidateDashboardAnalyticsData | undefined
  isLoading: boolean
  rangeKey: RangeKey
  onRangeChange: (value: RangeKey) => void
  readiness: CandidateDashboardReadiness
}

type ActivitySeriesKey = 'applications' | 'shortlisted' | 'interviews' | 'offers'

const RANGE_OPTIONS: Array<{ label: string; value: RangeKey }> = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

const FUNNEL_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

const SERIES_META = [
  { key: 'applications', label: 'Applications', tone: 'primary' },
  { key: 'shortlisted', label: 'Shortlisted', tone: 'secondary' },
  { key: 'interviews', label: 'Interviews', tone: 'success' },
  { key: 'offers', label: 'Offers', tone: 'accent' },
] as const

function formatDayLabel(value: string, rangeKey: RangeKey): string {
  const format =
    rangeKey === '90d'
      ? { month: 'short' as const }
      : { month: 'short' as const, day: 'numeric' as const }

  return new Date(value).toLocaleDateString('en-US', format)
}

function buildLinePath(values: number[], width: number, height: number, maxValue: number): string {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const y = height - (values[0] / maxValue) * height
    return `M 0 ${y} L ${width} ${y}`
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - (value / maxValue) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function buildAreaPath(values: number[], width: number, height: number, maxValue: number): string {
  const linePath = buildLinePath(values, width, height, maxValue)
  if (!linePath || values.length === 0) return ''
  return `${linePath} L ${width} ${height} L 0 ${height} Z`
}

function sumSeries(
  data: CandidateDashboardAnalyticsTimeseriesPoint[],
  key: ActivitySeriesKey,
): number {
  return data.reduce((total, point) => total + point[key], 0)
}

function describeDelta(
  data: CandidateDashboardAnalyticsTimeseriesPoint[],
  key: ActivitySeriesKey,
): string {
  if (data.length < 2) return 'Stable in selected range'

  const midpoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midpoint).reduce((total, point) => total + point[key], 0)
  const secondHalf = data.slice(midpoint).reduce((total, point) => total + point[key], 0)
  const delta = secondHalf - firstHalf

  if (delta > 0) return `+${delta} vs first half`
  if (delta < 0) return `${delta} vs first half`
  return 'Flat vs first half'
}

function InsightsSkeleton() {
  return (
    <div className="candidate-dashboard__analytics">
      <div className="dashboard-metric-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dash-card" aria-hidden="true">
            <div className="dash-card__body candidate-dashboard__analytics-body">
              <div className="skeleton-block dashboard-card-skeleton__title" />
              <div className="skeleton-block dashboard-card-skeleton__value" />
              <div className="skeleton-block dashboard-card-skeleton__meta" />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--2col">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="dash-card" aria-hidden="true">
            <div className="dash-card__header">
              <div className="skeleton-block dashboard-card-skeleton__title" />
            </div>
            <div className="dash-card__body candidate-dashboard__analytics-body">
              <div className="skeleton-block dashboard-analytics__chart-skeleton" />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card" aria-hidden="true">
        <div className="dash-card__header">
          <div className="skeleton-block dashboard-card-skeleton__title" />
        </div>
        <div className="dash-card__body candidate-dashboard__analytics-body">
          <div className="skeleton-block dashboard-analytics__chart-skeleton dashboard-analytics__chart-skeleton--tall" />
        </div>
      </div>
    </div>
  )
}

function MetricSparkline({ values, tone }: { values: number[]; tone: string }) {
  const width = 120
  const height = 36
  const maxValue = Math.max(...values, 1)

  return (
    <svg
      className="dashboard-metric-card__sparkline"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
    >
      <path
        d={buildAreaPath(values, width, height, maxValue)}
        className="dashboard-metric-card__sparklineArea"
      />
      <path
        d={buildLinePath(values, width, height, maxValue)}
        className={`dashboard-metric-card__sparklineLine dashboard-metric-card__sparklineLine--${tone}`}
      />
    </svg>
  )
}

function CandidateMetricCards({ analytics }: { analytics: CandidateDashboardAnalyticsData }) {
  return (
    <div className="dashboard-metric-grid">
      {SERIES_META.map((series) => {
        const values = analytics.timeseries.map((point) => point[series.key])
        return (
          <div key={series.key} className="dash-card dashboard-metric-card">
            <div className="dash-card__body candidate-dashboard__analytics-body">
              <div className="dashboard-metric-card__header">
                <div>
                  <div className="dashboard-metric-card__label">{series.label}</div>
                  <div className="dashboard-metric-card__value">
                    {sumSeries(analytics.timeseries, series.key)}
                  </div>
                </div>
                <MetricSparkline values={values} tone={series.tone} />
              </div>
              <div className="dashboard-metric-card__meta">
                {describeDelta(analytics.timeseries, series.key)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CandidateActivityChart({
  data,
  rangeKey,
}: {
  data: CandidateDashboardAnalyticsTimeseriesPoint[]
  rangeKey: RangeKey
}) {
  const width = 640
  const height = 220
  const allValues = data.flatMap((point) => [
    point.applications,
    point.shortlisted,
    point.interviews,
    point.offers,
  ])
  const maxValue = Math.max(...allValues, 1)
  const yLabels = [maxValue, Math.max(Math.round(maxValue / 2), 1), 0]

  return (
    <div className="dashboard-line-chart">
      <div className="dashboard-chart-legend">
        {SERIES_META.map((series) => (
          <span key={series.key} className="dashboard-chart-legend__item">
            <span
              className={`dashboard-chart-legend__swatch dashboard-chart-legend__swatch--${series.tone}`}
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="dashboard-line-chart__frame">
        <div className="dashboard-line-chart__ylabels">
          {yLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <svg
          className="dashboard-line-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Application activity trend"
        >
          {[0.1, 0.5, 0.9].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              x2={width}
              y1={height - height * fraction}
              y2={height - height * fraction}
              className="dashboard-line-chart__grid"
            />
          ))}

          <path
            d={buildAreaPath(
              data.map((point) => point.applications),
              width,
              height,
              maxValue,
            )}
            className="dashboard-line-chart__area"
          />

          {SERIES_META.map((series) => (
            <path
              key={series.key}
              d={buildLinePath(
                data.map((point) => point[series.key]),
                width,
                height,
                maxValue,
              )}
              className={`dashboard-line-chart__series dashboard-line-chart__series--${series.tone}`}
            />
          ))}
        </svg>
      </div>

      <div className="dashboard-line-chart__xlabels">
        {data.map((point, index) => {
          const shouldShowLabel =
            data.length <= 8 ||
            index === 0 ||
            index === data.length - 1 ||
            index % Math.max(Math.floor(data.length / 4), 1) === 0

          return (
            <span key={point.date}>
              {shouldShowLabel ? formatDayLabel(point.date, rangeKey) : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function CandidateDashboardInsights({
  analytics,
  isLoading,
  rangeKey,
  onRangeChange,
  readiness,
}: CandidateDashboardInsightsProps) {
  if (isLoading && !analytics) {
    return <InsightsSkeleton />
  }

  if (!analytics) {
    return null
  }

  const funnelMax = Math.max(...analytics.funnel.map((item) => item.count), 1)
  const progressStyle = {
    '--dashboard-progress': `${readiness.completion}%`,
  } as CSSProperties

  return (
    <div className="candidate-dashboard__analytics">
      <div className="dashboard-range-tabs">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`dashboard-range-tabs__button${rangeKey === option.value ? ' dashboard-range-tabs__button--active' : ''}`}
            onClick={() => onRangeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <CandidateMetricCards analytics={analytics} />

      <div className="dash-grid dash-grid--2col">
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Application funnel</div>
              <div className="dash-card__subtitle">
                Current movement across your job search pipeline.
              </div>
            </div>
          </div>
          <div className="dash-card__body candidate-dashboard__analytics-body">
            <div className="dashboard-funnel-list">
              {analytics.funnel.map((item) => (
                <div key={item.stage} className="dashboard-funnel-list__row">
                  <div className="dashboard-funnel-list__label">
                    {FUNNEL_LABELS[item.stage] ?? item.stage}
                  </div>
                  <div className="dashboard-funnel-list__track">
                    <span
                      className={`dashboard-funnel-list__fill dashboard-funnel-list__fill--${item.stage}`}
                      style={{ width: `${(item.count / funnelMax) * 100}%` }}
                    />
                  </div>
                  <div className="dashboard-funnel-list__value">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Readiness</div>
              <div className="dash-card__subtitle">
                Profile strength and search posture from your latest setup.
              </div>
            </div>
          </div>
          <div className="dash-card__body candidate-dashboard__analytics-body">
            <div className="dashboard-readiness">
              <div className="dashboard-readiness__ring" style={progressStyle}>
                <div className="dashboard-readiness__ringInner">
                  <strong>{readiness.completion}%</strong>
                  <span>Complete</span>
                </div>
              </div>

              <div className="dashboard-readiness__stats">
                <div className="dashboard-readiness__stat">
                  <span className="dashboard-readiness__label">Target roles</span>
                  <strong>{readiness.targetRoles}</strong>
                </div>
                <div className="dashboard-readiness__stat">
                  <span className="dashboard-readiness__label">Skills</span>
                  <strong>{readiness.skills}</strong>
                </div>
                <div className="dashboard-readiness__stat">
                  <span className="dashboard-readiness__label">Open to work</span>
                  <strong>{readiness.isOpenToWork ? 'Active' : 'Off'}</strong>
                </div>
              </div>
            </div>

            <div className="dashboard-velocity-grid">
              <div className="dashboard-velocity-grid__item">
                <span>Avg. to shortlist</span>
                <strong>{analytics.velocity.avg_days_to_shortlist ?? '--'}d</strong>
              </div>
              <div className="dashboard-velocity-grid__item">
                <span>Avg. to interview</span>
                <strong>{analytics.velocity.avg_days_to_interview ?? '--'}d</strong>
              </div>
              <div className="dashboard-velocity-grid__item">
                <span>Avg. to offer</span>
                <strong>{analytics.velocity.avg_days_to_offer ?? '--'}d</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Search activity</div>
            <div className="dash-card__subtitle">
              Applications sent and progress milestones across the selected range.
            </div>
          </div>
        </div>
        <div className="dash-card__body candidate-dashboard__analytics-body">
          <CandidateActivityChart data={analytics.timeseries} rangeKey={rangeKey} />
        </div>
      </div>
    </div>
  )
}
