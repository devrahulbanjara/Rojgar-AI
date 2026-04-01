'use client'

import { useMemo } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import ResumeTemplate from '@/app/candidate/resume/_components/ResumeTemplate'
import {
  type ApplicationStatus,
  useGetCompanyCandidateByIdQuery,
  useUpdateApplicationStatusMutation,
} from '@/store/services/applicationsApi'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Hash,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react'

import { CandidateDetailSkeleton } from '../_components/CandidatesSkeletons'
import InterviewRecordingCard from '../_components/InterviewRecordingCard'
import { mapRecruiterCandidateResume } from '../_lib/mapRecruiterCandidateResume'

function formatInterviewDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatInterviewTime(startValue: string, endValue: string) {
  const start = new Date(startValue)
  const end = new Date(endValue)
  const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${timeFmt.format(start)} - ${timeFmt.format(end)}`
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview_booked: 'Interview booked',
  interview_completed: 'Interview completed',
  offer: 'Offer',
  rejected: 'Rejected',
}

function getRecruiterTransitionOptions(status: ApplicationStatus): ApplicationStatus[] {
  switch (status) {
    case 'applied':
    case 'screening':
      return ['shortlisted', 'rejected']
    case 'shortlisted':
      return ['rejected']
    case 'interview_booked':
      return ['interview_completed']
    case 'interview_completed':
      return ['offer', 'rejected']
    default:
      return []
  }
}

export default function RecruiterCandidateDetailPage() {
  const params = useParams()
  const applicationId = params.application_id as string
  const { data: resp, isLoading, isError, refetch } = useGetCompanyCandidateByIdQuery(applicationId)
  const [updateApplicationStatus, { isLoading: isUpdatingStatus }] =
    useUpdateApplicationStatusMutation()
  const candidate = resp?.data
  const interview = candidate?.interview
  const transitionOptions = candidate ? getRecruiterTransitionOptions(candidate.status) : []

  const renderedResume = useMemo(() => mapRecruiterCandidateResume(candidate), [candidate])

  const handleStatusChange = async (nextStatus: string) => {
    if (!candidate || !nextStatus) return

    try {
      await updateApplicationStatus({
        application_id: candidate.id,
        body: { status: nextStatus as ApplicationStatus },
      }).unwrap()
      void refetch()
      toast.success(
        `Application moved to ${STATUS_LABELS[nextStatus as ApplicationStatus].toLowerCase()}.`,
      )
    } catch {
      toast.error('Could not update application status.')
    }
  }

  return (
    <div className="dash-content container container--app-shell">
      <Link href="/recruiter/candidates" className="jd-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Candidates
      </Link>

      {isLoading ? (
        <CandidateDetailSkeleton />
      ) : isError || !candidate ? (
        <div className="dash-card">
          <div className="dash-card__body">
            Could not load this candidate.{' '}
            <button className="auth__inline-link" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="recruiter-candidate-detail">
          <div className="dash-card">
            <div className="dash-card__body recruiter-candidate-detail__hero">
              <div className="recruiter-candidate-detail__identity">
                <div className="recruiter-candidate-detail__avatar">
                  {candidate.applicant_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={candidate.applicant_avatar_url} alt={candidate.applicant_name} />
                  ) : (
                    candidate.applicant_name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? '')
                      .join('')
                  )}
                </div>
                <div className="recruiter-candidate-detail__copy">
                  <h2 className="recruiter-candidate-detail__title">{candidate.applicant_name}</h2>
                  <p className="recruiter-candidate-detail__subtitle">{candidate.job_title}</p>
                  <div className="recruiter-candidate-detail__contacts">
                    {candidate.applicant_email ? (
                      <span className="recruiter-candidate-detail__contactValue">
                        <Mail size={12} />
                        {candidate.applicant_email}
                      </span>
                    ) : null}
                    {candidate.candidate_phone ? (
                      <span className="recruiter-candidate-detail__contactValue">
                        <Phone size={12} />
                        {candidate.candidate_phone}
                      </span>
                    ) : null}
                    {candidate.candidate_location ? (
                      <span className="recruiter-candidate-detail__contactValue">
                        <MapPin size={12} />
                        {candidate.candidate_location}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="recruiter-candidate-detail__contactStatus">
                <div className="recruiter-candidate-detail__statusControl">
                  <select
                    className="resume-field__input recruiter-candidate-detail__statusSelect"
                    value={candidate.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value
                      void handleStatusChange(nextStatus)
                    }}
                    disabled={isUpdatingStatus || transitionOptions.length === 0}
                  >
                    <option value={candidate.status} disabled>
                      Current: {STATUS_LABELS[candidate.status]}
                    </option>
                    {transitionOptions.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-grid dash-grid--2col recruiter-candidate-detail__grid">
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Interview scheduled</div>
                  <div className="dash-card__subtitle">
                    Booking details for this candidate&apos;s interview.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Interview date</div>
                  <p className="recruiter-candidate-detail__timelineTitle">
                    <CalendarDays size={14} aria-hidden="true" />{' '}
                    {interview?.start_time
                      ? formatInterviewDate(interview.start_time)
                      : 'Not available'}
                  </p>
                  <p className="recruiter-candidate-detail__timelineMeta">
                    <Clock3 size={14} aria-hidden="true" />{' '}
                    {interview?.start_time && interview?.end_time
                      ? formatInterviewTime(interview.start_time, interview.end_time)
                      : 'Not available'}
                  </p>
                  <p className="recruiter-candidate-detail__timelineMeta">
                    <MapPin size={14} aria-hidden="true" /> {interview?.location ?? 'Not available'}
                  </p>
                  <p className="cell-muted">{interview?.title ?? 'Not available'}</p>
                </div>

                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Booking reference</div>
                  <p
                    className="recruiter-candidate-detail__timelineTitle"
                    style={{ fontFamily: 'ui-monospace, monospace' }}
                  >
                    <Hash size={14} aria-hidden="true" />{' '}
                    {interview?.cal_booking_uid ?? 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Shared profile details</div>
                  <div className="dash-card__subtitle">
                    Only the details this candidate chose to share for this application.
                  </div>
                </div>
              </div>
              <div className="dash-card__body recruiter-candidate-detail__section">
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Headline</div>
                  <p>{candidate.candidate_headline ?? 'Not available'}</p>
                </div>
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Summary</div>
                  <p>{candidate.candidate_summary ?? 'Not available'}</p>
                </div>
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">Shared links</div>
                  <div className="recruiter-candidate-detail__links">
                    {candidate.linkedin_url ? (
                      <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">
                        LinkedIn <ExternalLink size={12} />
                      </a>
                    ) : (
                      <p className="cell-muted">LinkedIn: Not available</p>
                    )}
                    {candidate.github_url ? (
                      <a href={candidate.github_url} target="_blank" rel="noreferrer">
                        GitHub <ExternalLink size={12} />
                      </a>
                    ) : (
                      <p className="cell-muted">GitHub: Not available</p>
                    )}
                    {!candidate.linkedin_url && !candidate.github_url && !candidate.portfolio_url
                      ? null
                      : null}
                    {candidate.portfolio_url ? (
                      <a href={candidate.portfolio_url} target="_blank" rel="noreferrer">
                        Portfolio <ExternalLink size={12} />
                      </a>
                    ) : (
                      <p className="cell-muted">Portfolio: Not available</p>
                    )}
                  </div>
                </div>
                <div className="recruiter-candidate-detail__block">
                  <div className="recruiter-candidate-detail__label">AI review</div>
                  <p>{candidate.feedback ?? 'Not available'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-grid dash-grid--2col recruiter-candidate-detail__grid">
            <InterviewRecordingCard applicationId={applicationId} />

            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Resume attached</div>
                  <div className="dash-card__subtitle">
                    Snapshot details from the resume selected for this application.
                  </div>
                </div>
              </div>
              <div
                className="dash-card__body"
                style={{
                  overflowX: 'auto',
                  justifyContent: 'center',
                  background: renderedResume ? 'rgba(248, 250, 252, 0.8)' : undefined,
                }}
              >
                {renderedResume ? (
                  <div className="rv-page-shadow">
                    <ResumeTemplate resume={renderedResume} />
                  </div>
                ) : (
                  <div className="profile-empty">
                    <UserRound size={18} />
                    <p>No resume details are available for this application.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
