'use client'

import { type CSSProperties, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getCompanyAccent } from '@/lib/companyAccent'
import { getApplicationStatusLabel, getApplicationStatusVariant } from '@/lib/statusMetadata'
import {
  type ApplicationStatus,
  type CandidateApplicationView,
  useGetMyApplicationsQuery,
} from '@/store/services/applicationsApi'
import { Briefcase, Clock, MapPin, Search } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import DashboardErrorState from '@/components/common/DashboardErrorState'
import { FilterSelect, SearchInput, Toolbar } from '@/components/common/Toolbar'

import styles from './page.module.scss'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type StatusFilterKey = 'all' | ApplicationStatus

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilterKey; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_booked', label: 'Interview Booked' },
  { value: 'interview_completed', label: 'Interview Done' },
  { value: 'offer', label: 'Offer' },
  { value: 'offer_accepted', label: 'Accepted' },
  { value: 'offer_declined', label: 'Declined' },
  { value: 'rejected', label: 'Rejected' },
]

const PIPELINE_STAGES: Array<{
  key: Exclude<ApplicationStatus, 'rejected' | 'offer_accepted' | 'offer_declined'>
  label: string
}> = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview_booked', label: 'Interview' },
  { key: 'interview_completed', label: 'Completed' },
  { key: 'offer', label: 'Offer' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocationTypeLabel(lt: CandidateApplicationView['location_type']): string {
  switch (lt) {
    case 'remote':
      return 'Remote'
    case 'hybrid':
      return 'Hybrid'
    case 'onsite':
      return 'On-site'
  }
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hour = 3600000
  const day = 86400000

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / 60000))
    return `${minutes}m ago`
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour))
    return `${hours}h ago`
  }
  const days = Math.floor(diffMs / day)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getReviewFeedback(feedback: string | null): string | null {
  const trimmed = feedback?.trim()
  return trimmed || null
}

function getStatusDotClass(variant: string): string {
  switch (variant) {
    case 'gray':
      return styles['statusDot--gray']
    case 'warning':
      return styles['statusDot--warning']
    case 'secondary':
      return styles['statusDot--secondary']
    case 'primary':
      return styles['statusDot--primary']
    case 'success':
      return styles['statusDot--success']
    case 'danger':
      return styles['statusDot--danger']
    default:
      return styles['statusDot--gray']
  }
}

// ---------------------------------------------------------------------------
// Mini pipeline component
// ---------------------------------------------------------------------------

function MiniPipeline({ status }: { status: ApplicationStatus }) {
  if (status === 'rejected') {
    return (
      <div className={styles.pipeline}>
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.key}
            className={`${styles.pipelineStep} ${styles['pipelineStep--rejected']}`}
          />
        ))}
      </div>
    )
  }

  if (status === 'offer_accepted' || status === 'offer_declined') {
    return (
      <div className={styles.pipeline}>
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.key}
            className={`${styles.pipelineStep} ${status === 'offer_accepted' ? styles['pipelineStep--terminal'] : styles['pipelineStep--rejected']}`}
          />
        ))}
      </div>
    )
  }

  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === status)

  return (
    <div className={styles.pipeline}>
      {PIPELINE_STAGES.map((stage, i) => {
        let mod = ''
        if (i < currentIndex) mod = styles['pipelineStep--done']
        else if (i === currentIndex) mod = styles['pipelineStep--current']
        return <div key={stage.key} className={`${styles.pipelineStep} ${mod}`} />
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Application card
// ---------------------------------------------------------------------------

function ApplicationCard({ application }: { application: CandidateApplicationView }) {
  const router = useRouter()
  const accent = getCompanyAccent(application.company_name)
  const variant = getApplicationStatusVariant(application.status)
  const feedback = getReviewFeedback(application.feedback)
  const detailHref = `/candidate/applications/${application.id}`

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(detailHref)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(detailHref)
        }
      }}
      className={styles.card}
    >
      <div className={styles.cardHeader}>
        <Avatar
          name={application.company_name}
          src={application.company_logo_url}
          seed={application.company_name}
          kind="company"
          className={styles.logo}
          sizes="44px"
          style={
            {
              '--app-logo-bg': accent.background,
              '--app-logo-color': accent.color,
            } as CSSProperties
          }
        />
        <div className={styles.titleWrap}>
          <h3 className={styles.title}>{application.job_title}</h3>
          <div className={styles.company}>{application.company_name}</div>
          {application.location && (
            <div className={styles.companyLocation}>
              <MapPin size={11} aria-hidden="true" />
              {application.location}
            </div>
          )}
        </div>
      </div>

      <div className={styles.statusRow}>
        <span className={`${styles.statusDot} ${getStatusDotClass(variant)}`} />
        <span className={styles.statusLabel}>{getApplicationStatusLabel(application.status)}</span>
      </div>

      <MiniPipeline status={application.status} />

      <div className={styles.stats}>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Mode</span>
          <span className={styles.statValue}>
            {getLocationTypeLabel(application.location_type)}
          </span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>
            <Clock size={10} aria-hidden="true" /> Applied
          </span>
          <span className={styles.statValue}>{formatRelativeDate(application.created_at)}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>
            {application.score != null ? application.score : '—'}
          </span>
        </div>
      </div>

      <p className={`${styles.feedback} ${feedback ? '' : styles['feedback--empty']}`}>
        {feedback ?? 'No recruiter feedback yet.'}
      </p>

      <div className={styles.cardActions}>
        <Link
          href={detailHref}
          className="btn btn--secondary btn--sm"
          onClick={(e) => e.stopPropagation()}
        >
          View Details
        </Link>
        <Link
          href={`/candidate/jobs/${application.job_id}`}
          className="btn btn--ghost btn--sm"
          onClick={(e) => e.stopPropagation()}
        >
          View Job
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ApplicationsPage() {
  const [activeStage, setActiveStage] = useState<StatusFilterKey>('all')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyApplicationsQuery({
    page: 1,
    size: 100,
  })
  const applications = useMemo(() => data?.data ?? [], [data?.data])

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchInput.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesStage = activeStage === 'all' || application.status === activeStage
      const matchesSearch =
        normalizedQuery === '' ||
        application.company_name.toLowerCase().includes(normalizedQuery) ||
        application.job_title.toLowerCase().includes(normalizedQuery)

      return matchesStage && matchesSearch
    })
  }, [activeStage, applications, searchInput])

  if (isError) {
    return (
      <div className={`dash-content container container--app-shell ${styles.page}`}>
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
    <div className={`dash-content container container--app-shell ${styles.page}`}>
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
                ? 'Refreshing...'
                : `${applications.length} application${applications.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <Toolbar>
        <SearchInput
          value={searchInput}
          onChange={(next) => setSearchInput(next)}
          placeholder="Search company or role…"
        />
        <FilterSelect<StatusFilterKey>
          value={activeStage}
          onChange={(next) => setActiveStage(next)}
          options={STATUS_FILTER_OPTIONS}
          ariaLabel="Filter by status"
        />
      </Toolbar>

      {isLoading ? (
        <div className={styles.skeleton}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className={styles.empty}>
          <Search size={40} className={styles.emptyIcon} aria-hidden="true" />
          <p className={styles.emptyTitle}>
            {applications.length === 0
              ? 'No applications yet'
              : 'No applications match your filters'}
          </p>
          <p className={styles.emptyCopy}>
            {applications.length === 0
              ? 'Start by applying to jobs that interest you.'
              : 'Try changing your search or status filter.'}
          </p>
          {applications.length === 0 && (
            <Link href="/candidate/jobs" className="btn btn--primary btn--sm">
              <Briefcase size={14} aria-hidden="true" />
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  )
}
