'use client'

import { useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import {
  type ApplicationStatus,
  useGetMyCompanyCandidatesQuery,
} from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'
import { Mail, Search, UserRound, X } from 'lucide-react'

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
      if (selectedJobId !== 'all' && candidate.job_id !== selectedJobId) {
        return false
      }

      if (selectedStatus !== 'all' && candidate.status !== selectedStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        candidate.applicant_name,
        candidate.applicant_email ?? '',
        candidate.job_title,
        candidate.candidate_headline ?? '',
        candidate.candidate_location ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [candidates, searchTerm, selectedJobId, selectedStatus])

  const heading = 'Candidates'
  const subtitle =
    'Search and review every candidate across your jobs, then open a full profile when you need more detail.'

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">{heading}</h2>
          <p className="dash-page-header__subtitle">{subtitle}</p>
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
              placeholder="Search by candidate, email, headline, or job"
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
            <table className="dash-table dash-table--clickable">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    onClick={() => router.push(`/recruiter/candidates/${candidate.id}`)}
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
                            } as React.CSSProperties
                          }
                        >
                          {!candidate.applicant_avatar_url && getInitials(candidate.applicant_name)}
                        </div>
                        <div className="recruiter-candidates-table__identity">
                          <div className="recruiter-candidates-table__name">
                            {candidate.applicant_name}
                          </div>
                          <div className="recruiter-candidates-table__meta">
                            {candidate.applicant_email ? (
                              <span>
                                <Mail size={12} aria-hidden="true" />
                                {candidate.applicant_email}
                              </span>
                            ) : (
                              <span>Email hidden by candidate</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="recruiter-candidates-table__job">
                        <div>{candidate.job_title}</div>
                      </div>
                    </td>
                    <td>
                      <StatusPill kind="application" status={candidate.status} />
                    </td>
                    <td className="cell-muted">{formatDate(candidate.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
