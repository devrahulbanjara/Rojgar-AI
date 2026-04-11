'use client'

import type { CSSProperties } from 'react'

import {
  type CandidateDashboardAnalyticsData,
  type CandidateDashboardAnalyticsTimeseriesPoint,
} from '@/store/services/dashboardApi'

import CandidateMetricCard, { buildAreaPath, buildLinePath } from './CandidateMetricCard'

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

type ActivitySeriesKey = 'applications' | 'shortlisted' | 'interviews' | 'offers' | 'rejected'

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
  { key: 'rejected', label: 'Rejected', tone: 'danger' },
] as const

function formatDayLabel(value: string, rangeKey: RangeKey): string {
  const format =
    rangeKey === '90d'
      ? { month: 'short' as const }
      : { month: 'short' as const, day: 'numeric' as const }

  return new Date(value).toLocaleDateString('en-US', format)
}

function sumSeries(
  data: CandidateDashboardAnalyticsTimeseriesPoint[],
  key: ActivitySeriesKey,
): number {
  return data.reduce((total, point) => total + point[key], 0)
}

function InsightsSkeleton() {
  return (
    <div className="candidate-dashboard__analytics">
      <div className="dashboard-range-tabs" aria-hidden="true">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`dashboard-range-tabs__button${option.value === '30d' ? ' dashboard-range-tabs__button--active' : ''}`}
            disabled
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="dashboard-metric-grid dashboard-metric-grid--candidate-top">
        {SERIES_META.map((series) => (
          <div key={series.key} className="stat-card dashboard-metric-card" aria-hidden="true">
            <div className="dashboard-metric-card__header">
              <div className="dashboard-metric-card__copy">
                <div className="skeleton-block dashboard-card-skeleton__value" />
                <div className="stat-card__label">{series.label}</div>
              </div>
              <div className="skeleton-block dashboard-card-skeleton__metric-sparkline" />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--2col">
        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Application funnel</div>
              <div className="dash-card__subtitle">
                Current movement across your job search pipeline.
              </div>
            </div>
          </div>
          <div className="dash-card__body candidate-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>

        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Readiness</div>
              <div className="dash-card__subtitle">
                Profile strength and search posture from your latest setup.
              </div>
            </div>
          </div>
          <div className="dash-card__body candidate-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>
      </div>

      <div className="dash-card" aria-hidden="true">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Application activity</div>
            <div className="dash-card__subtitle">
              Applications sent and status milestones across the selected range.
            </div>
          </div>
        </div>
        <div className="dash-card__body candidate-dashboard__analytics-body">
          <div className="skeleton-block dashboard-analytics__chart-skeleton dashboard-analytics__chart-skeleton--tall" />
        </div>
      </div>
    </div>
  )
}

function CandidateMetricCards({ analytics }: { analytics: CandidateDashboardAnalyticsData }) {
  return (
    <div className="dashboard-metric-grid dashboard-metric-grid--candidate-top">
      {SERIES_META.map((series) => {
        const values = analytics.timeseries.map((point) => point[series.key])
        return (
          <CandidateMetricCard
            key={series.key}
            label={series.label}
            value={sumSeries(analytics.timeseries, series.key)}
            tone={series.tone}
            values={values}
          />
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
    point.rejected,
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
          {yLabels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
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
                <strong>
                  {analytics.velocity.avg_days_to_shortlist != null
                    ? `${analytics.velocity.avg_days_to_shortlist}d`
                    : 'N/A'}
                </strong>
              </div>
              <div className="dashboard-velocity-grid__item">
                <span>Avg. to interview</span>
                <strong>
                  {analytics.velocity.avg_days_to_interview != null
                    ? `${analytics.velocity.avg_days_to_interview}d`
                    : 'N/A'}
                </strong>
              </div>
              <div className="dashboard-velocity-grid__item">
                <span>Avg. to offer</span>
                <strong>
                  {analytics.velocity.avg_days_to_offer != null
                    ? `${analytics.velocity.avg_days_to_offer}d`
                    : 'N/A'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Application activity</div>
            <div className="dash-card__subtitle">
              Applications sent and status milestones across the selected range.
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
