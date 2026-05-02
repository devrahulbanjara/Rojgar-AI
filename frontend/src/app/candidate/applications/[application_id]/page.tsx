'use client'

import { type CSSProperties, useState } from 'react'
import { notify } from '@/lib/notify'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { parseApiError } from '@/lib/apiError'
import { getCompanyAccent } from '@/lib/companyAccent'
import { getApplicationStatusLabel } from '@/lib/statusMetadata'
import {
  type ActivityEvent,
  type ApplicationStatus,
  useGetApplicationByIdQuery,
  useRespondToOfferMutation,
} from '@/store/services/applicationsApi'
import { ArrowLeft, CalendarDays, Clock, ExternalLink, FileText, MapPin } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import DashboardErrorState from '@/components/common/DashboardErrorState'
import StatusPill from '@/components/common/StatusPill'

import styles from './page.module.scss'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(iso: string): string {
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

function getLocationTypeLabel(lt: 'remote' | 'onsite' | 'hybrid' | null): string | null {
  if (lt === 'remote') return 'Remote'
  if (lt === 'hybrid') return 'Hybrid'
  if (lt === 'onsite') return 'On-site'
  return null
}

function getStageStatusModifier(stageIndex: number, currentIndex: number): string {
  if (stageIndex < currentIndex) return styles['step--done']
  if (stageIndex === currentIndex) return styles['step--current']
  return ''
}

function buildNextStepCopy(status: ApplicationStatus, hint: string | null): string {
  if (hint) return hint
  switch (status) {
    case 'applied':
      return "Your application has been submitted. You'll see the recruiter's decision once the job has closed."
    case 'shortlisted':
      return "You've been shortlisted. Expect interview details soon."
    case 'interview_booked':
      return 'Prepare for your scheduled interview. Details are below.'
    case 'interview_completed':
      return "Interview wrapped up. The team is finalizing their decision — you'll hear back shortly."
    case 'offer':
      return 'You have an offer. Review the details and respond when ready.'
    case 'offer_accepted':
      return 'You accepted this offer. Congratulations.'
    case 'offer_declined':
      return 'You declined this offer.'
    case 'rejected':
      return 'This application did not move forward. Keep applying — better fits are out there.'
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PipelineStepper({ status }: { status: ApplicationStatus }) {
  const isRejected = status === 'rejected'
  const isAccepted = status === 'offer_accepted'
  const isDeclined = status === 'offer_declined'
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.key === status)

  return (
    <div className={styles.stepper}>
      <div className={styles.stepperRow}>
        {PIPELINE_STAGES.map((stage, i) => {
          let modifier = ''
          if (isRejected) modifier = styles['step--rejected']
          else if (isAccepted) modifier = styles['step--terminal']
          else if (isDeclined) modifier = styles['step--rejected']
          else modifier = getStageStatusModifier(i, currentIndex)

          const labelClass =
            i === currentIndex && !isRejected && !isAccepted && !isDeclined
              ? `${styles.stepLabel} ${styles['stepLabel--active']}`
              : styles.stepLabel

          return (
            <div className={`${styles.step} ${modifier}`} key={stage.key}>
              {i > 0 ? <span className={styles.stepBar} style={{ left: '-50%' }} /> : null}
              <span className={styles.stepDot}>{i + 1}</span>
              <span className={labelClass}>{stage.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimelineList({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className={styles.timelineEmpty}>No activity recorded yet.</p>
  }

  return (
    <ul className={styles.timeline}>
      {events.map((event) => (
        <li className={styles.timelineItem} key={event.id}>
          <span className={styles.timelineDot} />
          <p className={styles.timelineTitle}>{event.title}</p>
          {event.description ? <p className={styles.timelineDesc}>{event.description}</p> : null}
          <div className={styles.timelineTime}>{formatDateTime(event.created_at)}</div>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidateApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.application_id as string
  const { data, isLoading, isError, error, isFetching, refetch } =
    useGetApplicationByIdQuery(applicationId)
  const application = data?.data
  const [respondToOffer, { isLoading: isResponding }] = useRespondToOfferMutation()
  const [respondedAccepted, setRespondedAccepted] = useState<boolean | null>(null)

  async function handleOfferRespond(accepted: boolean) {
    try {
      await respondToOffer({ application_id: applicationId, accepted }).unwrap()
      setRespondedAccepted(accepted)
      notify.success(accepted ? 'Offer accepted.' : 'Offer declined.')
    } catch (err) {
      const parsed = parseApiError(err, {}, 'Failed to respond to offer.')
      notify.error(parsed.message)
    }
  }

  if (isLoading) {
    return (
      <div className={`dash-content container container--app-shell ${styles.page}`}>
        <Link
          href="/candidate/applications"
          className={`btn btn--ghost btn--sm ${styles.backLink}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Applications
        </Link>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    )
  }

  if (isError || !application) {
    return (
      <div className={`dash-content container container--app-shell ${styles.page}`}>
        <Link
          href="/candidate/applications"
          className={`btn btn--ghost btn--sm ${styles.backLink}`}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Applications
        </Link>
        <DashboardErrorState error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      </div>
    )
  }

  const accent = getCompanyAccent(application.company_name ?? '')
  const locationLabel = getLocationTypeLabel(application.location_type)
  const showOfferActions = application.status === 'offer' && respondedAccepted === null
  const offerWasResolved =
    respondedAccepted !== null ||
    application.status === 'offer_accepted' ||
    application.status === 'offer_declined'
  const accepted = respondedAccepted ?? application.status === 'offer_accepted'

  return (
    <div className={`dash-content container container--app-shell ${styles.page}`}>
      <Link href="/candidate/applications" className={`btn btn--ghost btn--sm ${styles.backLink}`}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Applications
      </Link>

      {/* Hero */}
      <div className={styles.hero}>
        <Avatar
          name={application.company_name ?? ''}
          src={application.company_logo_url}
          seed={application.company_name ?? ''}
          kind="company"
          className={styles.heroLogo}
          sizes="56px"
          style={
            {
              '--app-logo-bg': accent.background,
              '--app-logo-color': accent.color,
            } as CSSProperties
          }
        />
        <div className={styles.heroBody}>
          <h1 className={styles.heroTitle}>{application.job_title ?? 'Application'}</h1>
          {application.company_name ? (
            <span className={styles.heroCompany}>{application.company_name}</span>
          ) : null}
          <div className={styles.heroMeta}>
            {application.location ? (
              <span className={styles.heroMetaItem}>
                <MapPin size={12} aria-hidden="true" />
                {application.location}
              </span>
            ) : null}
            {locationLabel ? (
              <>
                {application.location ? <span className={styles.heroMetaSep}>·</span> : null}
                <span className={styles.heroMetaItem}>{locationLabel}</span>
              </>
            ) : null}
            <span className={styles.heroMetaSep}>·</span>
            <span className={styles.heroMetaItem}>
              <Clock size={12} aria-hidden="true" />
              Applied {formatRelative(application.created_at)}
            </span>
            {application.score != null ? (
              <>
                <span className={styles.heroMetaSep}>·</span>
                <span className={styles.heroMetaItem}>Match {application.score}</span>
              </>
            ) : null}
            {application.resume?.resume_name ? (
              <>
                <span className={styles.heroMetaSep}>·</span>
                <span className={styles.heroMetaItem}>
                  <FileText size={12} aria-hidden="true" />
                  {application.resume.resume_name}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className={styles.heroAside}>
          <StatusPill kind="application" status={application.status} />
          <Link href={`/candidate/jobs/${application.job_id}`} className="btn btn--ghost btn--sm">
            View job
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Pipeline stepper */}
      <PipelineStepper status={application.status} />

      {/* Status update */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>Where you stand</div>
        <h2 className={styles.sectionTitle}>{getApplicationStatusLabel(application.status)}</h2>
        <p className={styles.sectionBody}>
          {buildNextStepCopy(application.status, application.next_step_hint)}
        </p>

        {application.strengths?.length || application.weaknesses?.length ? (
          <div className={styles.feedback}>
            <div className={styles.feedbackColumns}>
              {application.strengths?.length ? (
                <div className={styles.feedbackColumn}>
                  <div className={styles.feedbackColumnHeader}>Strengths</div>
                  <ul className={styles.feedbackList}>
                    {application.strengths.map((s, i) => (
                      <li key={i} className={styles.feedbackStrength}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {application.weaknesses?.length ? (
                <div className={styles.feedbackColumn}>
                  <div className={styles.feedbackColumnHeader}>Weaknesses</div>
                  <ul className={styles.feedbackList}>
                    {application.weaknesses.map((w, i) => (
                      <li key={i} className={styles.feedbackWeakness}>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {showOfferActions ? (
          <div className={styles.offerActions}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void handleOfferRespond(true)}
              disabled={isResponding}
            >
              {isResponding ? 'Responding…' : 'Accept offer'}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => void handleOfferRespond(false)}
              disabled={isResponding}
            >
              {isResponding ? 'Responding…' : 'Decline offer'}
            </button>
          </div>
        ) : null}

        {!showOfferActions && offerWasResolved ? (
          <p className={styles.offerResolved}>
            {accepted
              ? 'You accepted this offer. Congratulations on the new role.'
              : 'You declined this offer.'}
          </p>
        ) : null}
      </section>

      {/* Interview */}
      {application.interview ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>Interview</div>
          <h2 className={styles.sectionTitle}>
            {application.interview.title ?? 'Scheduled interview'}
          </h2>
          <div className={styles.interviewGrid}>
            <div className={styles.interviewCell}>
              <span className={styles.interviewLabel}>Starts</span>
              <span className={styles.interviewValue}>
                <CalendarDays size={14} aria-hidden="true" />
                {formatDateTime(application.interview.start_time)}
              </span>
            </div>
            <div className={styles.interviewCell}>
              <span className={styles.interviewLabel}>Ends</span>
              <span className={styles.interviewValue}>
                <Clock size={14} aria-hidden="true" />
                {formatDateTime(application.interview.end_time)}
              </span>
            </div>
            {application.interview.location ? (
              <div className={styles.interviewCell}>
                <span className={styles.interviewLabel}>Location</span>
                <span className={styles.interviewValue}>
                  <MapPin size={14} aria-hidden="true" />
                  {application.interview.location.startsWith('http') ? (
                    <a
                      href={application.interview.location}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join meeting
                    </a>
                  ) : (
                    application.interview.location
                  )}
                </span>
              </div>
            ) : null}
            {application.interview.timezone ? (
              <div className={styles.interviewCell}>
                <span className={styles.interviewLabel}>Timezone</span>
                <span className={styles.interviewValue}>{application.interview.timezone}</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Activity */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>Activity</div>
        <TimelineList events={application.timeline} />
      </section>
    </div>
  )
}
