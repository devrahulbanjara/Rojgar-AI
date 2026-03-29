'use client'

import { type CSSProperties, Fragment, useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
} from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { ChevronDown, ChevronRight, Mail, Search, UserRound, X } from 'lucide-react'

import StatusPill from '@/components/common/StatusPill'

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

export default function RecruiterCandidatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialJobId = searchParams.get('job_id') ?? 'all'
  const [selectedJobId, setSelectedJobId] = useState(initialJobId)
  const [selectedStatus, setSelectedStatus] = useState<'all' | ApplicationStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null)

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
                  <th>Latest status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => {
                  const hasMoreApplications = candidate.application_count > 1
                  const isExpanded = expandedCandidateId === candidate.candidate_id
                  const additionalCount = Math.max(candidate.application_count - 1, 0)

                  return (
                    <Fragment key={candidate.candidate_id}>
                      <tr>
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
                                onClick={() =>
                                  setExpandedCandidateId((current) =>
                                    current === candidate.candidate_id
                                      ? null
                                      : candidate.candidate_id,
                                  )
                                }
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
                        <td>
                          <StatusPill kind="application" status={candidate.latest_status} />
                        </td>
                        <td className="cell-muted">{formatDate(candidate.latest_updated_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={() =>
                              router.push(
                                `/recruiter/candidates/${candidate.latest_application_id}`,
                              )
                            }
                          >
                            Open latest
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="recruiter-candidates-grouped__expandedRow">
                          <td colSpan={5}>
                            <div className="recruiter-candidates-grouped__expandedPanel">
                              <div className="recruiter-candidates-grouped__expandedTitle">
                                Applications to your company
                              </div>
                              <div className="recruiter-candidates-grouped__applicationList">
                                {candidate.applications.map((application) => (
                                  <div
                                    key={application.application_id}
                                    className="recruiter-candidates-grouped__applicationItem"
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
                                      <StatusPill kind="application" status={application.status} />
                                      <button
                                        type="button"
                                        className="btn btn--outline btn--sm"
                                        onClick={() =>
                                          router.push(
                                            `/recruiter/candidates/${application.application_id}`,
                                          )
                                        }
                                      >
                                        Open
                                      </button>
                                    </div>
                                  </div>
                                ))}
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
