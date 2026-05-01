'use client'

import {
  type RecruiterDashboardAnalyticsData,
  type RecruiterDashboardAnalyticsTimeseriesPoint,
} from '@/store/services/dashboardApi'

import SegmentedControl from '@/components/common/SegmentedControl'

type RangeKey = '7d' | '30d' | '90d'

type RecruiterDashboardInsightsProps = {
  analytics: RecruiterDashboardAnalyticsData | undefined
  isLoading: boolean
  rangeKey: RangeKey
  onRangeChange: (value: RangeKey) => void
}

type RecruiterMetricTone = 'primary' | 'secondary' | 'success' | 'accent' | 'warning'

const RANGE_OPTIONS: Array<{ label: string; value: RangeKey }> = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
]

const FUNNEL_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview_booked: 'Interview booked',
  interview_completed: 'Interview completed',
  offer: 'Offer',
}

const HIRING_GROUPS = [
  { key: 'new_applicants' as const, tone: 'primary', label: 'Applicants' },
  { key: 'completed_reviews' as const, tone: 'secondary', label: 'Reviews' },
  { key: 'interviews_scheduled' as const, tone: 'success', label: 'Interviews' },
] as const

const TOP_METRICS = [
  { key: 'applicants', label: 'Applicants', tone: 'primary' },
  { key: 'reviews', label: 'Reviews', tone: 'secondary' },
  { key: 'interviews', label: 'Interviews', tone: 'success' },
  { key: 'offers', label: 'Offers', tone: 'accent' },
  { key: 'drafts', label: 'Drafts to approve', tone: 'warning' },
] as const

const OUTREACH_KEYS = ['sent', 'approved', 'drafted', 'discarded'] as const

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function sampleTimeseries<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data
  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, i) => i % step === 0 || i === data.length - 1)
}

function sumSeries(
  data: RecruiterDashboardAnalyticsTimeseriesPoint[],
  key: (typeof HIRING_GROUPS)[number]['key'],
): number {
  return data.reduce((total, point) => total + point[key], 0)
}

function getValueClassName(tone: RecruiterMetricTone): string {
  if (tone === 'warning') return 'stat-card__value recruiter-dashboard__stat-value--warning'
  return 'stat-card__value'
}

function RecruiterMetricCards({ analytics }: { analytics: RecruiterDashboardAnalyticsData }) {
  const cards = [
    {
      key: 'applicants',
      label: 'Applicants',
      value: sumSeries(analytics.applications_timeseries, 'new_applicants'),
      tone: 'primary' as const,
    },
    {
      key: 'reviews',
      label: 'Reviews',
      value: sumSeries(analytics.applications_timeseries, 'completed_reviews'),
      tone: 'secondary' as const,
    },
    {
      key: 'interviews',
      label: 'Interviews',
      value: sumSeries(analytics.applications_timeseries, 'interviews_scheduled'),
      tone: 'success' as const,
    },
    {
      key: 'offers',
      label: 'Offers',
      value: analytics.stats.offers,
      tone: 'accent' as const,
    },
    {
      key: 'drafts',
      label: 'Drafts to approve',
      value: analytics.stats.pending_drafts,
      tone: 'warning' as const,
    },
  ]

  return (
    <div className="dashboard-metric-grid dashboard-metric-grid--recruiter-top">
      {cards.map((card) => (
        <div key={card.key} className="stat-card dashboard-metric-card">
          <div className="dashboard-metric-card__copy">
            <div className={getValueClassName(card.tone)}>{card.value}</div>
            <div className="stat-card__label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function HiringActivityGroupedBar({
  data,
  rangeKey,
}: {
  data: RecruiterDashboardAnalyticsTimeseriesPoint[]
  rangeKey: RangeKey
}) {
  const maxPoints = rangeKey === '7d' ? 7 : 14
  const sampled = sampleTimeseries(data, maxPoints)
  const maxValue = Math.max(
    ...sampled.flatMap((point) => HIRING_GROUPS.map((g) => point[g.key])),
    1,
  )

  return (
    <div>
      <div className="dashboard-chart-legend" style={{ marginBottom: '0.75rem' }}>
        {HIRING_GROUPS.map((g) => (
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
              {HIRING_GROUPS.map((g) => (
                <div
                  key={g.key}
                  className={`dashboard-grouped-bar__bar dashboard-grouped-bar__bar--${g.tone}`}
                  style={{ height: `${(point[g.key] / maxValue) * 100}%` }}
                />
              ))}
            </div>
            <div className="dashboard-grouped-bar__label">{formatShortDate(point.date)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutreachStatRow({
  label,
  breakdown,
}: {
  label: string
  breakdown: { drafted: number; approved: number; sent: number; discarded: number }
}) {
  return (
    <div className="dashboard-outreach-row">
      <div className="dashboard-outreach-row__label">{label}</div>
      <div className="dashboard-outreach-row__stats">
        {OUTREACH_KEYS.map((key) => (
          <div key={key} className="dashboard-outreach-row__stat">
            <strong>{breakdown[key]}</strong>
            <span>{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="recruiter-dashboard__analytics">
      <SegmentedControl
        options={RANGE_OPTIONS}
        value="30d"
        onChange={() => {}}
        ariaLabel="Select time range"
      />

      <div className="dashboard-metric-grid dashboard-metric-grid--recruiter-top">
        {TOP_METRICS.map((item) => (
          <div key={item.key} className="stat-card dashboard-metric-card" aria-hidden="true">
            <div className="dashboard-metric-card__copy">
              <div className="skeleton-block dashboard-card-skeleton__value" />
              <div className="stat-card__label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        {['Company funnel', 'Pipeline velocity'].map((title) => (
          <div key={title} className="dash-card" aria-hidden="true">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">{title}</div>
              </div>
            </div>
            <div className="dash-card__body recruiter-dashboard__analytics-body">
              <div className="skeleton-block dashboard-analytics__chart-skeleton" />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--3070 recruiter-dashboard__grid">
        {['Outreach summary', 'Hiring activity'].map((title) => (
          <div key={title} className="dash-card" aria-hidden="true">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title">{title}</div>
              </div>
            </div>
            <div className="dash-card__body recruiter-dashboard__analytics-body">
              <div className="skeleton-block dashboard-analytics__chart-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RecruiterDashboardInsights({
  analytics,
  isLoading,
  rangeKey,
  onRangeChange,
}: RecruiterDashboardInsightsProps) {
  if (isLoading && !analytics) {
    return <InsightsSkeleton />
  }

  if (!analytics) {
    return null
  }

  const funnelMax = Math.max(...analytics.funnel.map((item) => item.count), 1)

  return (
    <div className="recruiter-dashboard__analytics">
      <SegmentedControl
        options={RANGE_OPTIONS}
        value={rangeKey}
        onChange={onRangeChange}
        ariaLabel="Select time range"
      />

      <RecruiterMetricCards analytics={analytics} />

      {/* Row 1: Company funnel + Pipeline velocity */}
      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Company funnel</div>
              <div className="dash-card__subtitle">
                Live view of the hiring pipeline across current company activity.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
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
              <div className="dash-card__title">Pipeline velocity</div>
              <div className="dash-card__subtitle">
                Average movement from application to review, shortlist, and interview.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="dashboard-velocity-grid dashboard-velocity-grid--compact">
              <div className="dashboard-velocity-grid__item">
                <span>To review</span>
                <strong>{analytics.velocity.avg_days_to_review ?? '--'}d</strong>
              </div>
              <div className="dashboard-velocity-grid__item">
                <span>To shortlist</span>
                <strong>{analytics.velocity.avg_days_to_shortlist ?? '--'}d</strong>
              </div>
              <div className="dashboard-velocity-grid__item">
                <span>To interview</span>
                <strong>{analytics.velocity.avg_days_to_interview ?? '--'}d</strong>
              </div>
            </div>

            <div className="dashboard-kpi-strip">
              <div className="dashboard-kpi-strip__item">
                <span>Screening</span>
                <strong>{analytics.stats.screening}</strong>
              </div>
              <div className="dashboard-kpi-strip__item">
                <span>Interview booked</span>
                <strong>{analytics.stats.interview_booked}</strong>
              </div>
              <div className="dashboard-kpi-strip__item">
                <span>Offers</span>
                <strong>{analytics.stats.offers}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Outreach summary (condensed) + Hiring activity */}
      <div className="dash-grid dash-grid--3070 recruiter-dashboard__grid">
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Outreach summary</div>
              <div className="dash-card__subtitle">Email state for shortlist and rejection.</div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <OutreachStatRow label="Shortlist" breakdown={analytics.outreach.shortlist} />
            <OutreachStatRow label="Rejection" breakdown={analytics.outreach.rejection} />
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Hiring activity</div>
              <div className="dash-card__subtitle">
                New applicants, completed reviews, and scheduled interviews by period.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <HiringActivityGroupedBar
              data={analytics.applications_timeseries}
              rangeKey={rangeKey}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
