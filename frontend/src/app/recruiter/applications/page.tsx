'use client'
import { useSearchParams } from 'next/navigation'

import { useGetMyCompanyApplicationsQuery } from '@/store/services/applicationsApi'
import { Briefcase, Mail, UserRound } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  screening: 'Screening',
  interview: 'Interview',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

const STATUS_VARIANTS: Record<string, string> = {
  submitted: 'gray',
  screening: 'info',
  interview: 'warning',
  offered: 'success',
  hired: 'success',
  rejected: 'danger',
  withdrawn: 'gray',
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status
}

function getStatusVariant(status: string) {
  return STATUS_VARIANTS[status] ?? 'gray'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CompanyApplicationsPage() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job_id') ?? undefined
  const {
    data: resp,
    isLoading,
    isError,
    refetch,
  } = useGetMyCompanyApplicationsQuery(jobId ? { job_id: jobId } : undefined)

  const applications = resp?.data ?? []
  const heading = jobId ? 'Applicants for Selected Job' : 'Application Inbox'
  const subtitle = jobId
    ? 'Review everyone who applied to this role.'
    : 'Review applications across all active and past job postings.'

  return (
    <div className="dash-content container container--app-shell">
      <div className="dash-page-header">
        <div className="dash-page-header__left">
          <h2 className="dash-page-header__title">{heading}</h2>
          <p className="dash-page-header__subtitle">{subtitle}</p>
        </div>
      </div>

      {isLoading && (
        <div className="dash-card">
          <div className="dash-card__body">Loading applications...</div>
        </div>
      )}

      {isError && (
        <div className="dash-card">
          <div className="dash-card__body">
            Failed to load applications.{' '}
            <button className="auth__inline-link" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !isError && applications.length === 0 && (
        <div className="dash-card">
          <div
            className="dash-card__body"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <Briefcase
              size={36}
              aria-hidden="true"
              style={{ color: 'var(--color-muted,#9ca3af)' }}
            />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No applicants yet</div>
              <div style={{ color: 'var(--color-muted,#9ca3af)', fontSize: '0.875rem' }}>
                Applicants for this job will appear here as soon as they apply.
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && applications.length > 0 && (
        <div className="dash-card">
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div className="cell-user">
                        <div className="cell-user__avatar cell-user__avatar--sm cell-user__avatar--rect">
                          <UserRound size={14} aria-hidden="true" />
                        </div>
                        {application.applicant_name}
                      </div>
                    </td>
                    <td className="cell-meta">
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                      >
                        <Mail size={13} aria-hidden="true" />
                        {application.applicant_email}
                      </span>
                    </td>
                    <td className="cell-meta">{application.job_title}</td>
                    <td>
                      <span className={`badge badge--${getStatusVariant(application.status)}`}>
                        {getStatusLabel(application.status)}
                      </span>
                    </td>
                    <td className="cell-muted">{formatDate(application.created_at)}</td>
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
