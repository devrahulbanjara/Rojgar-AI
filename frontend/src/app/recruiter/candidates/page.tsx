'use client'

import { type CSSProperties, Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
  useUpdateApplicationStatusMutation,
} from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { ChevronDown, ChevronRight, Mail, Search, UserRound, X } from 'lucide-react'

import { CandidatesTableSkeleton } from './_components/CandidatesSkeletons'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

function getAvatarColor(name: string): string {
  const colors = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return colors[seed % colors.length]
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_OPTIONS: Array<{ value: 'all' | ApplicationStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_booked', label: 'Interview booked' },
  { value: 'interview_completed', label: 'Interview completed' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

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

export default function RecruiterCandidatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialJobId = searchParams.get('job_id') ?? 'all'
  const [selectedJobId, setSelectedJobId] = useState(initialJobId)
  const [selectedStatus, setSelectedStatus] = useState<'all' | ApplicationStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null)
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation()

  const { data: jobsResp } = useGetCompanyJobsQuery()
  const {
    data: resp,
    isLoading,
    isError,
    refetch,
  } = useGetMyCompanyCandidatesQuery({
    page: 1,
    size: 200,
  })

  const jobs = jobsResp?.data ?? []
  const candidates = useMemo(() => resp?.data ?? [], [resp?.data])
  const [statusSelectValues, setStatusSelectValues] = useState<Record<string, ApplicationStatus>>(
    {},
  )
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return candidates.filter((candidate) => {
      if (
        selectedJobId !== 'all' &&
        !candidate.applications.some((application) => application.job_id === selectedJobId)
      ) {
        return false
      }

      if (
        selectedStatus !== 'all' &&
        !candidate.applications.some((application) => application.status === selectedStatus)
      ) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        candidate.applicant_name,
        candidate.applicant_email,
        candidate.primary_job_title,
        ...candidate.applications.map((application) => application.job_title),
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [candidates, searchTerm, selectedJobId, selectedStatus])

  useEffect(() => {
    const nextValues: Record<string, ApplicationStatus> = {}
    candidates.forEach((candidate) => {
      candidate.applications.forEach((application) => {
        nextValues[application.application_id] = application.status
      })
    })
    setStatusSelectValues(nextValues)
  }, [candidates])

  const handleApplicationStatusChange = async (
    applicationId: string,
    nextStatus: ApplicationStatus,
    currentStatus: ApplicationStatus,
  ) => {
    if (updatingStatusId) return
    setUpdatingStatusId(applicationId)
    try {
      await updateApplicationStatus({
        application_id: applicationId,
        body: { status: nextStatus },
      }).unwrap()
      toast.success(`Application moved to ${STATUS_LABELS[nextStatus].toLowerCase()}.`)
      setStatusSelectValues((prev) => ({ ...prev, [applicationId]: nextStatus }))
    } catch {
      toast.error('Could not update application status.')
      setStatusSelectValues((prev) => ({ ...prev, [applicationId]: currentStatus }))
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const openApplication = (applicationId: string) => {
    router.push(`/recruiter/candidates/${applicationId}`)
  }

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">Candidates</h2>
          <p className="dash-page-header__subtitle">
            Review one row per candidate, then open the exact application you want when you need the
            details they shared for that job.
          </p>
        </div>
        <div className="dash-page-header__actions">
          <span className="badge badge--gray">
            {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card__body recruiter-candidates-toolbar">
          <div className="dash-page-toolbar__search recruiter-candidates-toolbar__search">
            <span className="dash-page-toolbar__icon">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              type="text"
              className="dash-page-toolbar__input"
              placeholder="Search by candidate, email, or job"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            {searchTerm ? (
              <button
                type="button"
                className="dash-page-toolbar__clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <select
            className="resume-field__input recruiter-candidates-toolbar__select"
            value={selectedJobId}
            onChange={(event) => setSelectedJobId(event.target.value)}
          >
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <select
            className="resume-field__input recruiter-candidates-toolbar__select"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as 'all' | ApplicationStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <CandidatesTableSkeleton count={5} />
      ) : isError ? (
        <div className="dash-card">
          <div className="dash-card__body">
            Failed to load candidates.{' '}
            <button className="auth__inline-link" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="dash-card">
          <div className="dash-card__body dash-empty-state">
            <UserRound className="dash-empty-state__icon" />
            <p>No candidates match these filters yet.</p>
          </div>
        </div>
      ) : (
        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table recruiter-candidates-grouped">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applications</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => {
                  const hasMoreApplications = candidate.application_count > 1
                  const isExpanded = expandedCandidateId === candidate.candidate_id
                  const additionalCount = Math.max(candidate.application_count - 1, 0)

                  return (
                    <Fragment key={candidate.candidate_id}>
                      <tr
                        className="recruiter-candidates-grouped__summaryRow"
                        role="link"
                        tabIndex={0}
                        onClick={() => openApplication(candidate.latest_application_id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openApplication(candidate.latest_application_id)
                          }
                        }}
                      >
                        <td>
                          <div className="cell-user">
                            <div
                              className="cell-user__avatar cell-user__avatar--sm"
                              style={
                                {
                                  '--avatar-bg': getAvatarColor(candidate.applicant_name) + '1A',
                                  '--avatar-color': getAvatarColor(candidate.applicant_name),
                                  backgroundImage: candidate.applicant_avatar_url
                                    ? `url(${candidate.applicant_avatar_url})`
                                    : undefined,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                } as CSSProperties
                              }
                            >
                              {!candidate.applicant_avatar_url &&
                                getInitials(candidate.applicant_name)}
                            </div>
                            <div className="recruiter-candidates-table__identity">
                              <div className="recruiter-candidates-table__name">
                                {candidate.applicant_name}
                              </div>
                              <div className="recruiter-candidates-table__meta">
                                <span>
                                  <Mail size={12} aria-hidden="true" />
                                  {candidate.applicant_email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="recruiter-candidates-grouped__applicationsCell">
                            <div className="recruiter-candidates-grouped__primaryJob">
                              {candidate.primary_job_title}
                            </div>
                            {hasMoreApplications ? (
                              <button
                                type="button"
                                className="recruiter-candidates-grouped__more"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setExpandedCandidateId((current) =>
                                    current === candidate.candidate_id
                                      ? null
                                      : candidate.candidate_id,
                                  )
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                                +{additionalCount} more
                              </button>
                            ) : (
                              <span className="cell-muted">1 application</span>
                            )}
                          </div>
                        </td>
                        <td className="cell-muted">{formatDate(candidate.latest_updated_at)}</td>
                      </tr>
                      {isExpanded ? (
                        <tr className="recruiter-candidates-grouped__expandedRow">
                          <td colSpan={4}>
                            <div className="recruiter-candidates-grouped__expandedPanel">
                              <div className="recruiter-candidates-grouped__expandedTitle">
                                Applications to your company
                              </div>
                              <div className="recruiter-candidates-grouped__applicationList">
                                {candidate.applications.map((application) => {
                                  const applicationValue =
                                    statusSelectValues[application.application_id] ??
                                    application.status
                                  const applicationTransitions =
                                    getRecruiterTransitionOptions(applicationValue)

                                  return (
                                    <button
                                      type="button"
                                      key={application.application_id}
                                      className="recruiter-candidates-grouped__applicationItem"
                                      onClick={() => openApplication(application.application_id)}
                                    >
                                      <div className="recruiter-candidates-grouped__applicationCopy">
                                        <div className="recruiter-candidates-grouped__applicationJob">
                                          {application.job_title}
                                        </div>
                                        <div className="recruiter-candidates-table__meta">
                                          <span>Applied {formatDate(application.created_at)}</span>
                                          {application.score !== null ? (
                                            <span>Score {application.score}/100</span>
                                          ) : null}
                                        </div>
                                      </div>
                                      <div className="recruiter-candidates-grouped__applicationActions">
                                        <select
                                          className="resume-field__input recruiter-candidates-grouped__statusSelect"
                                          value={applicationValue}
                                          onChange={(event) =>
                                            void handleApplicationStatusChange(
                                              application.application_id,
                                              event.target.value as ApplicationStatus,
                                              applicationValue,
                                            )
                                          }
                                          onClick={(event) => {
                                            event.stopPropagation()
                                          }}
                                          onMouseDown={(event) => event.stopPropagation()}
                                          disabled={
                                            applicationTransitions.length === 0 ||
                                            updatingStatusId === application.application_id
                                          }
                                        >
                                          <option value={applicationValue} disabled>
                                            Current: {STATUS_LABELS[applicationValue]}
                                          </option>
                                          {applicationTransitions.map((status) => (
                                            <option key={status} value={status}>
                                              {STATUS_LABELS[status]}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
