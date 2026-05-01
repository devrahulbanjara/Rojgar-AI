'use client'

import { type CSSProperties, useMemo, useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { getApplicationStatusLabel } from '@/lib/applicationStatus'
import { getCompanyAccent } from '@/lib/companyAccent'
import {
  type ApplicationStatus,
  type CandidateApplicationView,
  useGetMyApplicationsQuery,
} from '@/store/services/applicationsApi'
import { Search } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import DashboardErrorState from '@/components/common/DashboardErrorState'
import StatusPill from '@/components/common/StatusPill'
import { SearchInput, Toolbar } from '@/components/common/Toolbar'

import {
  ApplicationsDetailSkeleton,
  ApplicationsListSkeleton,
} from './_components/ApplicationsSkeletons'

type StatusFilterKey = 'all' | ApplicationStatus
type WorkModeFilter = 'all' | CandidateApplicationView['location_type']

type StageFilter = {
  key: StatusFilterKey
  label: string
}

type TimelineStep = {
  stage: string
  date: string
  done: boolean
  current?: boolean
}

const STATUS_FILTERS: StageFilter[] = [
  { key: 'all', label: 'All Applications' },
  { key: 'applied', label: 'Applied' },
  { key: 'screening', label: 'Screening' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_booked', label: 'Interview Booked' },
  { key: 'interview_completed', label: 'Interview Completed' },
  { key: 'offer', label: 'Offer' },
  { key: 'offer_accepted', label: 'Offer Accepted' },
  { key: 'offer_declined', label: 'Offer Declined' },
  { key: 'rejected', label: 'Rejected' },
]

const WORK_MODE_FILTERS: Array<{ key: WorkModeFilter; label: string }> = [
  { key: 'all', label: 'All Modes' },
  { key: 'remote', label: 'Remote' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'onsite', label: 'Onsite' },
]

const ACTIVE_TIMELINE: Array<{
  key: Exclude<ApplicationStatus, 'rejected'>
  label: string
}> = [
  { key: 'applied', label: 'Applied' },
  { key: 'screening', label: 'Screening' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_booked', label: 'Interview Booked' },
  { key: 'interview_completed', label: 'Interview Completed' },
  { key: 'offer', label: 'Offer' },
]

function getLocationTypeLabel(locationType: CandidateApplicationView['location_type']): string {
  switch (locationType) {
    case 'remote':
      return 'Remote'
    case 'hybrid':
      return 'Hybrid'
    case 'onsite':
      return 'Onsite'
  }
}

function formatLocation(application: CandidateApplicationView): string {
  return application.location ?? getLocationTypeLabel(application.location_type)
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeDate(iso: string): string {
  const timestamp = new Date(iso).getTime()
  const diffMs = Date.now() - timestamp
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)))
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(diffMs / day)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return formatDisplayDate(iso)
}

function getStatusLabel(status: ApplicationStatus): string {
  return getApplicationStatusLabel(status)
}

function getStatusUpdateCopy(application: CandidateApplicationView): string {
  const statusLabel = getStatusLabel(application.status)

  switch (application.status) {
    case 'applied':
      return `Application submitted ${formatRelativeDate(application.created_at)}.`
    case 'screening':
      return `Your application is currently being screened as of ${formatDisplayDate(application.updated_at)}.`
    case 'shortlisted':
      return `You were shortlisted on ${formatDisplayDate(application.updated_at)}.`
    case 'interview_booked':
      return `Interview booked on ${formatDisplayDate(application.updated_at)}.`
    case 'interview_completed':
      return `Your interview was marked completed on ${formatDisplayDate(application.updated_at)}.`
    case 'offer':
      return `An offer was recorded on ${formatDisplayDate(application.updated_at)}.`
    case 'offer_accepted':
      return `You accepted the offer on ${formatDisplayDate(application.updated_at)}.`
    case 'offer_declined':
      return `You declined the offer on ${formatDisplayDate(application.updated_at)}.`
    case 'rejected':
      return `This application was closed as rejected on ${formatDisplayDate(application.updated_at)}.`
    default:
      return `${statusLabel} ${formatRelativeDate(application.updated_at)}.`
  }
}

function getReviewFeedback(feedback: string | null): string | null {
  const trimmedFeedback = feedback?.trim()
  return trimmedFeedback ? trimmedFeedback : null
}

function buildTimeline(application: CandidateApplicationView): TimelineStep[] {
  if (
    application.status === 'rejected' ||
    application.status === 'offer_accepted' ||
    application.status === 'offer_declined'
  ) {
    return [
      {
        stage: 'Applied',
        date: formatShortDate(application.created_at),
        done: true,
      },
      {
        stage: getStatusLabel(application.status),
        date: formatShortDate(application.updated_at),
        done: false,
        current: true,
      },
    ]
  }

  const currentIndex = ACTIVE_TIMELINE.findIndex((step) => step.key === application.status)

  return ACTIVE_TIMELINE.map((step, index) => ({
    stage: step.label,
    date:
      index === 0
        ? formatShortDate(application.created_at)
        : index === currentIndex
          ? formatShortDate(application.updated_at)
          : '—',
    done: index < currentIndex,
    current: index === currentIndex,
  }))
}

export default function ApplicationsPage() {
  const searchParams = useSearchParams()
  const requestedApplicationId = searchParams.get('application')
  const [activeStage, setActiveStage] = useState<StatusFilterKey>('all')
  const [selectedMode, setSelectedMode] = useState<WorkModeFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyApplicationsQuery({
    page: 1,
    size: 100,
  })
  const applications = useMemo(() => data?.data ?? [], [data?.data])

  const statusCounts = useMemo(() => {
    return applications.reduce<Record<ApplicationStatus, number>>(
      (accumulator, application) => {
        accumulator[application.status] += 1
        return accumulator
      },
      {
        applied: 0,
        screening: 0,
        shortlisted: 0,
        interview_booked: 0,
        interview_completed: 0,
        offer: 0,
        offer_accepted: 0,
        offer_declined: 0,
        rejected: 0,
      },
    )
  }, [applications])

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesStage = activeStage === 'all' || application.status === activeStage
      const matchesMode = selectedMode === 'all' || application.location_type === selectedMode
      const matchesSearch =
        normalizedQuery === '' ||
        application.company_name.toLowerCase().includes(normalizedQuery) ||
        application.job_title.toLowerCase().includes(normalizedQuery)

      return matchesStage && matchesMode && matchesSearch
    })
  }, [activeStage, applications, searchInput, selectedMode])

  const selectedApplication = useMemo(() => {
    if (filteredApplications.length === 0) return null

    const preferredApplicationId = selectedApplicationId ?? requestedApplicationId

    return (
      filteredApplications.find((application) => application.id === preferredApplicationId) ??
      filteredApplications[0]
    )
  }, [filteredApplications, requestedApplicationId, selectedApplicationId])

  if (isError) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">My Applications</h2>
            <p className="dash-page-header__subtitle">
              Track and manage all your job applications in one place.
            </p>
          </div>
        </div>

        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      </div>
    )
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">My Applications</h2>
          <p className="dash-page-header__subtitle">
            Track and manage all your job applications in one place.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="page-header-hint">
            {isLoading
              ? 'Loading applications...'
              : isFetching
                ? 'Refreshing applications...'
                : `${applications.length} total application${applications.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <div className="apps-layout">
        <aside className="apps-layout__sidebar">
          <div className="apps-sidebar">
            <div className="apps-sidebar__title">Status</div>
            <div className="apps-sidebar__stages">
              {STATUS_FILTERS.map((stage) => (
                <button
                  key={stage.key}
                  type="button"
                  className="btn btn--ghost btn--sm btn--full"
                  aria-pressed={activeStage === stage.key}
                  onClick={() => setActiveStage(stage.key)}
                >
                  <span className="apps-sidebar__stage-label">{stage.label}</span>
                  <span className="apps-sidebar__stage-count">
                    {stage.key === 'all'
                      ? applications.length
                      : statusCounts[stage.key as ApplicationStatus]}
                  </span>
                </button>
              ))}
            </div>

            <div className="apps-sidebar__divider" />

            <div className="apps-sidebar__title">Work Mode</div>
            <div className="apps-sidebar__types">
              {WORK_MODE_FILTERS.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  className="btn btn--ghost btn--sm btn--full"
                  aria-pressed={selectedMode === mode.key}
                  onClick={() => setSelectedMode(mode.key)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="apps-layout__list">
          <Toolbar>
            <SearchInput
              value={searchInput}
              onChange={(next) => setSearchInput(next)}
              placeholder="Search company or role..."
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setSearchInput(searchInput)}
            >
              Search
            </button>
          </Toolbar>

          {isLoading ? (
            <ApplicationsListSkeleton count={5} />
          ) : (
            <div className="apps-list content-stagger">
              {filteredApplications.length === 0 ? (
                <div className="apps-empty">
                  <Search size={40} aria-hidden="true" />
                  <p>
                    {applications.length === 0
                      ? 'No applications yet.'
                      : 'No applications match your filters.'}
                  </p>
                  <Link href="/candidate/jobs" className="btn btn--primary btn--sm">
                    Browse jobs
                  </Link>
                </div>
              ) : (
                filteredApplications.map((application, index) => {
                  const accent = getCompanyAccent(application.company_name)

                  return (
                    <button
                      key={application.id}
                      type="button"
                      className="app-item content-stagger-item"
                      aria-pressed={selectedApplication?.id === application.id}
                      style={{ '--stagger-index': index } as CSSProperties}
                      onClick={() => setSelectedApplicationId(application.id)}
                    >
                      <Avatar
                        name={application.company_name}
                        src={application.company_logo_url}
                        seed={application.company_name}
                        kind="company"
                        className="app-item__logo"
                        sizes="48px"
                        style={
                          {
                            '--app-logo-bg': accent.background,
                            '--app-logo-color': accent.color,
                          } as CSSProperties
                        }
                      />
                      <div className="app-item__body">
                        <div className="app-item__top">
                          <Link
                            href={`/candidate/jobs/${application.job_id}`}
                            className="app-item__role app-item__role--link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {application.job_title}
                          </Link>
                          <StatusPill kind="application" status={application.status} />
                        </div>
                        <div className="app-item__company">
                          {application.company_name}
                          <span className="app-item__sep">·</span>
                          {formatLocation(application)}
                        </div>
                        <div className="app-item__meta">
                          <span>{getLocationTypeLabel(application.location_type)}</span>
                          <span className="app-item__sep">·</span>
                          <span>Applied {formatRelativeDate(application.created_at)}</span>
                        </div>
                        {getReviewFeedback(application.feedback) ? (
                          <div
                            className="cell-actions"
                            style={{
                              marginTop: '0.5rem',
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                            }}
                          >
                            <span className="cell-muted">
                              {getReviewFeedback(application.feedback)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        <aside className="apps-layout__detail">
          {isLoading ? (
            <ApplicationsDetailSkeleton />
          ) : isFetching && !selectedApplication ? (
            <ApplicationsDetailSkeleton />
          ) : selectedApplication ? (
            <div className="app-detail content-fade-in">
              <div className="app-detail__header">
                <Avatar
                  name={selectedApplication.company_name}
                  src={selectedApplication.company_logo_url}
                  seed={selectedApplication.company_name}
                  kind="company"
                  className="app-detail__logo"
                  sizes="72px"
                  style={
                    {
                      '--app-logo-bg': getCompanyAccent(selectedApplication.company_name)
                        .background,
                      '--app-logo-color': getCompanyAccent(selectedApplication.company_name).color,
                    } as CSSProperties
                  }
                />
                <div className="app-detail__info">
                  <div className="app-detail__role">{selectedApplication.job_title}</div>
                  <div className="app-detail__company">{selectedApplication.company_name}</div>
                  <div className="app-detail__location">{formatLocation(selectedApplication)}</div>
                </div>
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Application Status</div>
                <StatusPill kind="application" status={selectedApplication.status} />
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Timeline</div>
                <div className="app-timeline">
                  {buildTimeline(selectedApplication).map((step, index, steps) => (
                    <div
                      key={`${step.stage}-${index}`}
                      className={`app-timeline__step${step.done ? ' app-timeline__step--done' : ''}${step.current ? ' app-timeline__step--current' : ''}`}
                    >
                      <div className="app-timeline__marker">
                        <div className="app-timeline__dot" />
                        {index < steps.length - 1 ? <div className="app-timeline__line" /> : null}
                      </div>
                      <div className="app-timeline__content">
                        <div className="app-timeline__stage">{step.stage}</div>
                        <div className="app-timeline__date">{step.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="app-detail__section">
                <div className="app-detail__section-title">Latest Update</div>
                <p className="app-detail__activity">{getStatusUpdateCopy(selectedApplication)}</p>
              </div>

              {getReviewFeedback(selectedApplication.feedback) ? (
                <div className="app-detail__section">
                  <div className="app-detail__section-title">Application Review</div>
                  <p className="app-detail__activity">
                    {getReviewFeedback(selectedApplication.feedback)}
                  </p>
                </div>
              ) : null}

              <div className="app-detail__section">
                <div className="app-detail__section-title">Details</div>
                <div className="app-detail__facts">
                  <div className="app-detail__fact">
                    <span className="app-detail__fact-label">Applied</span>
                    <span className="app-detail__fact-value">
                      {formatDisplayDate(selectedApplication.created_at)}
                    </span>
                  </div>
                  <div className="app-detail__fact">
                    <span className="app-detail__fact-label">Last Updated</span>
                    <span className="app-detail__fact-value">
                      {formatDisplayDate(selectedApplication.updated_at)}
                    </span>
                  </div>
                  <div className="app-detail__fact">
                    <span className="app-detail__fact-label">Work Mode</span>
                    <span className="app-detail__fact-value">
                      {getLocationTypeLabel(selectedApplication.location_type)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="app-detail__actions">
                <Link
                  href={`/candidate/applications/${selectedApplication.id}`}
                  className="btn btn--primary btn--sm"
                >
                  Open Full Detail
                </Link>
                <Link
                  href={`/candidate/jobs/${selectedApplication.job_id}`}
                  className="btn btn--secondary btn--sm"
                >
                  View Job
                </Link>
              </div>
            </div>
          ) : (
            <div className="app-detail-empty content-fade-in">
              <p>Select an application to view details</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
