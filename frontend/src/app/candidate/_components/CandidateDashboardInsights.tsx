'use client'

import type { CSSProperties } from 'react'

import {
  type CandidateDashboardAnalyticsData,
  type CandidateDashboardAnalyticsTimeseriesPoint,
} from '@/store/services/dashboardApi'

import SegmentedControl from '@/components/common/SegmentedControl'

import CandidateMetricCard from './CandidateMetricCard'

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
  { key: 'applications' as const, label: 'Applications', tone: 'primary' as const },
  { key: 'shortlisted' as const, label: 'Shortlisted', tone: 'success' as const },
  { key: 'interviews' as const, label: 'Interviews', tone: 'secondary' as const },
  { key: 'offers' as const, label: 'Offers', tone: 'accent' as const },
  { key: 'rejected' as const, label: 'Rejected', tone: 'danger' as const },
]

const ACTIVITY_GROUPS = [
  { key: 'applications' as const, tone: 'primary', label: 'Applied' },
  { key: 'shortlisted' as const, tone: 'success', label: 'Shortlisted' },
  { key: 'interviews' as const, tone: 'blue', label: 'Interviews' },
] as const

function formatDayLabel(value: string, rangeKey: RangeKey): string {
  const format =
    rangeKey === '90d'
      ? { month: 'short' as const }
      : { month: 'short' as const, day: 'numeric' as const }
  return new Date(value).toLocaleDateString('en-US', format)
}

function sampleTimeseries<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0 || i === data.length - 1)
}

function sumSeries(
  data: CandidateDashboardAnalyticsTimeseriesPoint[],
  key: (typeof SERIES_META)[number]['key'],
): number {
  return data.reduce((total, point) => total + point[key], 0)
}

function ActivityGroupedBar({
  data,
  rangeKey,
}: {
  data: CandidateDashboardAnalyticsTimeseriesPoint[]
  rangeKey: RangeKey
}) {
  const maxPoints = rangeKey === '7d' ? 7 : 14
  const sampled = sampleTimeseries(data, maxPoints)
  const maxValue = Math.max(
    ...sampled.flatMap((point) => ACTIVITY_GROUPS.map((g) => point[g.key])),
    1,
  )

  return (
    <div>
      <div className="dashboard-chart-legend" style={{ marginBottom: '0.75rem' }}>
        {ACTIVITY_GROUPS.map((g) => (
          <span key={g.key} className="dashboard-chart-legend__item">
            <span
              className={`dashboard-chart-legend__swatch dashboard-chart-legend__swatch--${g.tone}`}
            />
            {g.label}
          </span>
        ))}
      </div>
      <div className="dashboard-grouped-bar">
        {sampled.map((point) => (
          <div key={point.date} className="dashboard-grouped-bar__group">
            <div className="dashboard-grouped-bar__bars">
              {ACTIVITY_GROUPS.map((g) => (
                <div
                  key={g.key}
                  className={`dashboard-grouped-bar__bar dashboard-grouped-bar__bar--${g.tone}`}
                  style={{ height: `${(point[g.key] / maxValue) * 100}%` }}
                />
              ))}
            </div>
            <div className="dashboard-grouped-bar__label">
              {formatDayLabel(point.date, rangeKey)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="candidate-dashboard__analytics">
      <SegmentedControl
        options={RANGE_OPTIONS}
        value="30d"
        onChange={() => {}}
        ariaLabel="Select time range"
      />

      <div className="dashboard-metric-grid dashboard-metric-grid--candidate-top">
        {SERIES_META.map((series) => (
          <div key={series.key} className="stat-card dashboard-metric-card" aria-hidden="true">
            <div className="dashboard-metric-card__copy">
              <div className="skeleton-block dashboard-card-skeleton__value" />
              <div className="stat-card__label">{series.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--6040">
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
            <div className="dash-card__title">Activity over time</div>
            <div className="dash-card__subtitle">
              Applications sent and key milestones by period.
            </div>
          </div>
        </div>
        <div className="dash-card__body candidate-dashboard__analytics-body">
          <div className="skeleton-block dashboard-analytics__chart-skeleton" />
        </div>
      </div>
    </div>
  )
}

function CandidateMetricCards({ analytics }: { analytics: CandidateDashboardAnalyticsData }) {
  return (
    <div className="dashboard-metric-grid dashboard-metric-grid--candidate-top">
      {SERIES_META.map((series) => (
        <CandidateMetricCard
          key={series.key}
          label={series.label}
          value={sumSeries(analytics.timeseries, series.key)}
          tone={series.tone}
        />
      ))}
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
      <SegmentedControl
        options={RANGE_OPTIONS}
        value={rangeKey}
        onChange={onRangeChange}
        ariaLabel="Select time range"
      />

      <CandidateMetricCards analytics={analytics} />

      {/* Row 1: Funnel (60%) + Readiness (40%) */}
      <div className="dash-grid dash-grid--6040">
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

      {/* Row 2: Full-width Activity bar */}
      <div className="dash-card">
        <div className="dash-card__header">
          <div>
            <div className="dash-card__title">Activity over time</div>
            <div className="dash-card__subtitle">
              Applications sent and key milestones by period.
            </div>
          </div>
        </div>
        <div className="dash-card__body candidate-dashboard__analytics-body">
          <ActivityGroupedBar data={analytics.timeseries} rangeKey={rangeKey} />
        </div>
      </div>
    </div>
  )
}
