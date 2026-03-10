'use client'

import { type CSSProperties, useMemo, useState } from 'react'

import Link from 'next/link'

import {
  type ApplicationStatus,
  type CandidateApplicationView,
  useGetMyApplicationsQuery,
} from '@/store/services/applicationsApi'
import { Search, X } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'

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
  { key: 'submitted', label: 'Applied' },
  { key: 'screening', label: 'In Review' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
]

const WORK_MODE_FILTERS: Array<{ key: WorkModeFilter; label: string }> = [
  { key: 'all', label: 'All Modes' },
  { key: 'remote', label: 'Remote' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'onsite', label: 'Onsite' },
]

const ACTIVE_TIMELINE: Array<{
  key: Exclude<ApplicationStatus, 'rejected' | 'withdrawn'>
  label: string
}> = [
  { key: 'submitted', label: 'Applied' },
  { key: 'screening', label: 'In Review' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
]

const statusColorMap: Record<string, string> = {
  success: '#0cce6b',
  warning: '#f59e0b',
  primary: '#0070f3',
  gray: '#9ca3af',
  danger: '#ff4d4d',
}

function getCompanyAccent(name: string): { logo: string; color: string } {
  const palette = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    logo: name.trim().charAt(0).toUpperCase() || 'C',
    color: palette[seed % palette.length],
  }
}

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
  switch (status) {
    case 'submitted':
      return 'Applied'
    case 'screening':
      return 'In Review'
    case 'interview':
      return 'Interview'
    case 'offered':
      return 'Offer'
    case 'hired':
      return 'Hired'
    case 'rejected':
      return 'Rejected'
    case 'withdrawn':
      return 'Withdrawn'
  }
}

function getStatusVariant(status: ApplicationStatus): string {
  switch (status) {
    case 'interview':
    case 'offered':
    case 'hired':
      return 'success'
    case 'screening':
      return 'warning'
    case 'rejected':
      return 'danger'
    case 'withdrawn':
    case 'submitted':
      return 'gray'
  }
}

function getStatusUpdateCopy(application: CandidateApplicationView): string {
  const statusLabel = getStatusLabel(application.status)

  switch (application.status) {
    case 'submitted':
      return `Application submitted ${formatRelativeDate(application.created_at)}.`
    case 'screening':
      return `Your application is in review as of ${formatDisplayDate(application.updated_at)}.`
    case 'interview':
      return `Interview stage reached ${formatDisplayDate(application.updated_at)}.`
    case 'offered':
      return `An offer was recorded on ${formatDisplayDate(application.updated_at)}.`
    case 'hired':
      return `This application was marked hired on ${formatDisplayDate(application.updated_at)}.`
    case 'rejected':
      return `This application was closed as rejected on ${formatDisplayDate(application.updated_at)}.`
    case 'withdrawn':
      return `This application was withdrawn on ${formatDisplayDate(application.updated_at)}.`
    default:
      return `${statusLabel} ${formatRelativeDate(application.updated_at)}.`
  }
}

function buildTimeline(application: CandidateApplicationView): TimelineStep[] {
  if (application.status === 'rejected' || application.status === 'withdrawn') {
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
  const [activeStage, setActiveStage] = useState<StatusFilterKey>('all')
  const [selectedMode, setSelectedMode] = useState<WorkModeFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  const { data, isLoading, isFetching, isError } = useGetMyApplicationsQuery({ page: 1, size: 100 })
  const applications = useMemo(() => data?.data ?? [], [data?.data])

  const statusCounts = useMemo(() => {
    return applications.reduce<Record<ApplicationStatus, number>>(
      (accumulator, application) => {
        accumulator[application.status] += 1
        return accumulator
      },
      {
        submitted: 0,
        screening: 0,
        interview: 0,
        offered: 0,
        hired: 0,
        rejected: 0,
        withdrawn: 0,
      },
    )
  }, [applications])

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesStage = activeStage === 'all' || application.status === activeStage
      const matchesMode = selectedMode === 'all' || application.location_type === selectedMode
      const matchesSearch =
        normalizedQuery === '' ||
        application.company_name.toLowerCase().includes(normalizedQuery) ||
        application.job_title.toLowerCase().includes(normalizedQuery)

      return matchesStage && matchesMode && matchesSearch
    })
  }, [activeStage, applications, searchQuery, selectedMode])

  const selectedApplication = useMemo(() => {
    if (filteredApplications.length === 0) return null

    return (
      filteredApplications.find((application) => application.id === selectedApplicationId) ??
      filteredApplications[0]
    )
  }, [filteredApplications, selectedApplicationId])

  function handleSearch(event?: React.FormEvent) {
    if (event) event.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  function handleClearSearch() {
    setSearchInput('')
    setSearchQuery('')
  }

  if (isError) {
    return (
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">My Applications</h2>
            <p className="dash-page-header__subtitle">
              Track and manage all your job applications in one place.
            </p>
          </div>
        </div>

        <div className="app-detail-empty content-fade-in">
          <p>Applications are unavailable right now. Please refresh and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-content container">
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
                  className={`apps-sidebar__stage${activeStage === stage.key ? ' apps-sidebar__stage--active' : ''}`}
                  onClick={() => setActiveStage(stage.key)}
                >
                  <span className="apps-sidebar__stage-label">{stage.label}</span>
                  <span className="apps-sidebar__stage-count">
                    {stage.key === 'all' ? applications.length : statusCounts[stage.key]}
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
                  className={`apps-sidebar__type-btn${selectedMode === mode.key ? ' apps-sidebar__type-btn--active' : ''}`}
                  onClick={() => setSelectedMode(mode.key)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="apps-layout__list">
          <form className="dash-page-toolbar" onSubmit={handleSearch}>
            <div className="dash-page-toolbar__search">
              <span className="dash-page-toolbar__icon">
                <Search size={16} aria-hidden="true" />
              </span>
              <input
                className="dash-page-toolbar__input"
                type="text"
                placeholder="Search company or role..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              {searchInput ? (
                <button
                  type="button"
                  className="dash-page-toolbar__clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <button type="submit" className="dash-page-toolbar__submit">
              Search
            </button>
          </form>

          {isLoading ? (
            <ApplicationsListSkeleton count={5} />
          ) : (
            <div className="apps-list content-stagger">
              {filteredApplications.length === 0 ? (
                <div className="apps-empty">
                  <Search size={40} aria-hidden="true" />
                  <p>No applications match your filters.</p>
                </div>
              ) : (
                filteredApplications.map((application, index) => {
                  const accent = getCompanyAccent(application.company_name)
                  const statusVariant = getStatusVariant(application.status)

                  return (
                    <button
                      key={application.id}
                      type="button"
                      className={`app-item content-stagger-item${selectedApplication?.id === application.id ? ' app-item--active' : ''}`}
                      style={{ '--stagger-index': index } as CSSProperties}
                      onClick={() => setSelectedApplicationId(application.id)}
                    >
                      <MediaBadge
                        src={application.company_logo_url}
                        alt={application.company_name}
                        fallback={accent.logo}
                        className="app-item__logo"
                        sizes="48px"
                        style={
                          {
                            '--app-logo-bg': accent.color + '1A',
                            '--app-logo-color': accent.color,
                          } as CSSProperties
                        }
                      />
                      <div className="app-item__body">
                        <div className="app-item__top">
                          <div className="app-item__role">{application.job_title}</div>
                          <span className={`badge badge--${statusVariant}`}>
                            <span
                              className="app-status-dot"
                              style={
                                {
                                  '--dot-color':
                                    statusColorMap[statusVariant] || statusColorMap.gray,
                                } as CSSProperties
                              }
                            />
                            {getStatusLabel(application.status)}
                          </span>
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
                <MediaBadge
                  src={selectedApplication.company_logo_url}
                  alt={selectedApplication.company_name}
                  fallback={getCompanyAccent(selectedApplication.company_name).logo}
                  className="app-detail__logo"
                  sizes="72px"
                  style={
                    {
                      '--app-logo-bg':
                        getCompanyAccent(selectedApplication.company_name).color + '1A',
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
                <span className={`badge badge--${getStatusVariant(selectedApplication.status)}`}>
                  <span
                    className="app-status-dot"
                    style={
                      {
                        '--dot-color':
                          statusColorMap[getStatusVariant(selectedApplication.status)] ||
                          statusColorMap.gray,
                      } as CSSProperties
                    }
                  />
                  {getStatusLabel(selectedApplication.status)}
                </span>
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
                  href={`/dashboard/jobs/${selectedApplication.job_id}`}
                  className="btn btn--primary btn--sm"
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
