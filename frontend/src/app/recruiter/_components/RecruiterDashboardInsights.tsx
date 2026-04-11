'use client'

import {
  type RecruiterDashboardAnalyticsData,
  type RecruiterDashboardAnalyticsTimeseriesPoint,
} from '@/store/services/dashboardApi'

type RangeKey = '7d' | '30d' | '90d'

type RecruiterDashboardInsightsProps = {
  analytics: RecruiterDashboardAnalyticsData | undefined
  isLoading: boolean
  rangeKey: RangeKey
  onRangeChange: (value: RangeKey) => void
}

type TrendSeriesKey = 'new_applicants' | 'completed_reviews' | 'interviews_scheduled'
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

const TREND_SERIES = [
  { key: 'new_applicants', label: 'Applicants', tone: 'primary' },
  { key: 'completed_reviews', label: 'Reviews', tone: 'secondary' },
  { key: 'interviews_scheduled', label: 'Interviews', tone: 'success' },
] as const

const OUTREACH_STATES = [
  { key: 'drafted', label: 'Drafted', tone: 'gray' },
  { key: 'approved', label: 'Approved', tone: 'primary' },
  { key: 'sent', label: 'Sent', tone: 'success' },
  { key: 'discarded', label: 'Discarded', tone: 'danger' },
] as const

const TOP_METRICS = [
  { key: 'applicants', label: 'Applicants', tone: 'primary' },
  { key: 'reviews', label: 'Reviews', tone: 'secondary' },
  { key: 'interviews', label: 'Interviews', tone: 'success' },
  { key: 'offers', label: 'Offers', tone: 'accent' },
  { key: 'drafts', label: 'Drafts to approve', tone: 'warning' },
] as const

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function buildLinePath(
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

function buildAreaPath(
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

function sumSeries(
  data: RecruiterDashboardAnalyticsTimeseriesPoint[],
  key: TrendSeriesKey,
): number {
  return data.reduce((total, point) => total + point[key], 0)
}

function getValueClassName(tone: RecruiterMetricTone): string {
  if (tone === 'warning') return 'stat-card__value recruiter-dashboard__stat-value--warning'
  return 'stat-card__value'
}

function buildFlatSeries(value: number, length: number): number[] {
  return Array.from({ length: Math.max(length, 2) }, () => value)
}

function MetricSparkline({ values, tone }: { values: number[]; tone: RecruiterMetricTone }) {
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

function InsightsSkeleton() {
  return (
    <div className="recruiter-dashboard__analytics">
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

      <div className="dashboard-metric-grid dashboard-metric-grid--recruiter-top">
        {TOP_METRICS.map((item) => (
          <div key={item.key} className="stat-card dashboard-metric-card" aria-hidden="true">
            <div className="dashboard-metric-card__header">
              <div className="dashboard-metric-card__copy">
                <div className="skeleton-block dashboard-card-skeleton__value" />
                <div className="stat-card__label">{item.label}</div>
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
              <div className="dash-card__title">Company funnel</div>
              <div className="dash-card__subtitle">
                Live view of the hiring pipeline across current company activity.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>

        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Pipeline velocity</div>
              <div className="dash-card__subtitle">
                Average movement from application to review, shortlist, and interview.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Hiring trend</div>
              <div className="dash-card__subtitle">
                New applicants, completed reviews, and scheduled interviews.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>

        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Score distribution</div>
              <div className="dash-card__subtitle">
                Current screening score mix across company applications.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Interview load</div>
              <div className="dash-card__subtitle">
                Scheduled interviews over the next two weeks.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>

        <div className="dash-card" aria-hidden="true">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Outreach state</div>
              <div className="dash-card__subtitle">
                Drafted, approved, sent, and discarded communication.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="skeleton-block dashboard-analytics__chart-skeleton" />
          </div>
        </div>
      </div>
    </div>
  )
}

function RecruiterMetricCards({ analytics }: { analytics: RecruiterDashboardAnalyticsData }) {
  const seriesLength = analytics.applications_timeseries.length
  const offerValues = buildFlatSeries(analytics.stats.offers, seriesLength)
  const draftValues = buildFlatSeries(analytics.stats.pending_drafts, seriesLength)
  const cards = [
    {
      key: 'applicants',
      label: 'Applicants',
      value: sumSeries(analytics.applications_timeseries, 'new_applicants'),
      tone: 'primary' as const,
      values: analytics.applications_timeseries.map((point) => point.new_applicants),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      value: sumSeries(analytics.applications_timeseries, 'completed_reviews'),
      tone: 'secondary' as const,
      values: analytics.applications_timeseries.map((point) => point.completed_reviews),
    },
    {
      key: 'interviews',
      label: 'Interviews',
      value: sumSeries(analytics.applications_timeseries, 'interviews_scheduled'),
      tone: 'success' as const,
      values: analytics.applications_timeseries.map((point) => point.interviews_scheduled),
    },
    {
      key: 'offers',
      label: 'Offers',
      value: analytics.stats.offers,
      tone: 'accent' as const,
      values: offerValues,
    },
    {
      key: 'drafts',
      label: 'Drafts to approve',
      value: analytics.stats.pending_drafts,
      tone: 'warning' as const,
      values: draftValues,
    },
  ]

  return (
    <div className="dashboard-metric-grid dashboard-metric-grid--recruiter-top">
      {cards.map((card) => (
        <div key={card.key} className="stat-card dashboard-metric-card">
          <div className="dashboard-metric-card__header">
            <div className="dashboard-metric-card__copy">
              <div className={getValueClassName(card.tone)}>{card.value}</div>
              <div className="stat-card__label">{card.label}</div>
            </div>
            <MetricSparkline values={card.values} tone={card.tone} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ApplicationsTrendChart({ data }: { data: RecruiterDashboardAnalyticsTimeseriesPoint[] }) {
  const width = 640
  const height = 220
  const values = data.flatMap((point) => [
    point.new_applicants,
    point.completed_reviews,
    point.interviews_scheduled,
  ])
  const maxValue = Math.max(...values, 1)

  return (
    <div className="dashboard-line-chart">
      <div className="dashboard-chart-legend">
        {TREND_SERIES.map((series) => (
          <span key={series.key} className="dashboard-chart-legend__item">
            <span
              className={`dashboard-chart-legend__swatch dashboard-chart-legend__swatch--${series.tone}`}
            />
            {series.label}
          </span>
        ))}
      </div>

      <div className="dashboard-line-chart__frame">
        <svg
          className="dashboard-line-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Recruiter dashboard trend"
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
              data.map((point) => point.new_applicants),
              width,
              height,
              maxValue,
            )}
            className="dashboard-line-chart__area"
          />

          {TREND_SERIES.map((series) => (
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

          return <span key={point.date}>{shouldShowLabel ? formatShortDate(point.date) : ''}</span>
        })}
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
  const scoreMax = Math.max(...analytics.score_distribution.buckets.map((item) => item.count), 1)
  const interviewMax = Math.max(...analytics.interview_load.map((item) => item.count), 1)

  return (
    <div className="recruiter-dashboard__analytics">
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

      <RecruiterMetricCards analytics={analytics} />

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

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Hiring trend</div>
              <div className="dash-card__subtitle">
                New applicants, completed reviews, and scheduled interviews.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <ApplicationsTrendChart data={analytics.applications_timeseries} />
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Score distribution</div>
              <div className="dash-card__subtitle">
                Current screening score mix across company applications.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="dashboard-bar-cluster">
              {analytics.score_distribution.buckets.map((bucket) => (
                <div key={bucket.label} className="dashboard-bar-cluster__item">
                  <div className="dashboard-bar-cluster__value">{bucket.count}</div>
                  <div className="dashboard-bar-cluster__track">
                    <span
                      className="dashboard-bar-cluster__fill"
                      style={{ height: `${(bucket.count / scoreMax) * 100}%` }}
                    />
                  </div>
                  <div className="dashboard-bar-cluster__label">{bucket.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid dash-grid--2col recruiter-dashboard__grid">
        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Interview load</div>
              <div className="dash-card__subtitle">
                Scheduled interviews over the next two weeks.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="dashboard-bar-cluster dashboard-bar-cluster--wide">
              {analytics.interview_load.map((point) => (
                <div key={point.date} className="dashboard-bar-cluster__item">
                  <div className="dashboard-bar-cluster__value">{point.count}</div>
                  <div className="dashboard-bar-cluster__track">
                    <span
                      className="dashboard-bar-cluster__fill dashboard-bar-cluster__fill--success"
                      style={{ height: `${(point.count / interviewMax) * 100}%` }}
                    />
                  </div>
                  <div className="dashboard-bar-cluster__label">{formatShortDate(point.date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header">
            <div>
              <div className="dash-card__title">Outreach state</div>
              <div className="dash-card__subtitle">
                Drafted, approved, sent, and discarded communication.
              </div>
            </div>
          </div>
          <div className="dash-card__body recruiter-dashboard__analytics-body">
            <div className="dashboard-chart-legend">
              {OUTREACH_STATES.map((state) => (
                <span key={state.key} className="dashboard-chart-legend__item">
                  <span
                    className={`dashboard-chart-legend__swatch dashboard-chart-legend__swatch--${state.tone}`}
                  />
                  {state.label}
                </span>
              ))}
            </div>

            {(['shortlist', 'rejection'] as const).map((type) => {
              const total = OUTREACH_STATES.reduce(
                (sum, state) => sum + analytics.outreach[type][state.key],
                0,
              )

              return (
                <div key={type} className="dashboard-stacked-meter">
                  <div className="dashboard-stacked-meter__header">
                    <span className="dashboard-stacked-meter__title">
                      {type === 'shortlist' ? 'Shortlist emails' : 'Rejection emails'}
                    </span>
                    <span className="dashboard-stacked-meter__total">{total}</span>
                  </div>
                  <div className="dashboard-stacked-meter__track">
                    {OUTREACH_STATES.map((state) => (
                      <span
                        key={state.key}
                        className={`dashboard-stacked-meter__segment dashboard-stacked-meter__segment--${state.tone}`}
                        style={{
                          width:
                            total === 0
                              ? '0%'
                              : `${(analytics.outreach[type][state.key] / total) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
