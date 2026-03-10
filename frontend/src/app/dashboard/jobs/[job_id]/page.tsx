'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { useApplyToJobMutation } from '@/store/services/applicationsApi'
import {
  type JobDetail,
  type JobListItem,
  type LocationType,
  getJobStatusLabel,
  useGetJobByIdQuery,
  useSearchJobsQuery,
} from '@/store/services/jobsApi'
import { useGetMyResumesQuery } from '@/store/services/resumeApi'
import { ArrowLeft, Bookmark, Briefcase, Building, Clock, MapPin, Share2, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

function formatSalary(min?: number | null, max?: number | null, currency = 'USD'): string | null {
  if (!min && !max) return null
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  if (min) return `From ${currency} ${min.toLocaleString()}`
  return `Up to ${currency} ${max!.toLocaleString()}`
}

function formatDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Apply modal
// ---------------------------------------------------------------------------

function ApplyModal({
  jobId,
  jobTitle,
  onClose,
}: {
  jobId: string
  jobTitle: string
  onClose: () => void
}) {
  const { data: resumesResp, isLoading: loadingResumes } = useGetMyResumesQuery()
  const [applyToJob, { isLoading: applying }] = useApplyToJobMutation()
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  const resumes = resumesResp?.data ?? []

  async function handleSubmit() {
    if (!selectedResumeId) return
    try {
      await applyToJob({ job_id: jobId, resume_id: selectedResumeId }).unwrap()
      toast.success('Application submitted successfully!')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message
      toast.error(msg ?? 'Failed to submit application.')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
      >
        <div className="modal__header">
          <div className="modal__title" id="apply-modal-title">
            Apply to {jobTitle}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal__body">
          {loadingResumes ? (
            <p>Loading your resumes…</p>
          ) : resumes.length === 0 ? (
            <p style={{ color: 'var(--color-muted,#6b7280)' }}>
              You need to{' '}
              <Link href="/dashboard/resume" className="auth__inline-link">
                create a resume
              </Link>{' '}
              before applying.
            </p>
          ) : (
            <>
              <p
                style={{
                  marginBottom: '0.75rem',
                  fontSize: '0.875rem',
                  color: 'var(--color-muted,#6b7280)',
                }}
              >
                Select a resume to submit with your application:
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {resumes.map((r) => (
                  <label
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: `1.5px solid ${selectedResumeId === r.id ? 'var(--color-primary,#0070f3)' : 'var(--color-gray-200,#e5e7eb)'}`,
                      cursor: 'pointer',
                      background: selectedResumeId === r.id ? 'rgba(0,112,243,0.06)' : '',
                    }}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={r.id}
                      checked={selectedResumeId === r.id}
                      onChange={() => setSelectedResumeId(r.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{r.resume_name}</div>
                      {r.headline && (
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            color: 'var(--color-muted,#6b7280)',
                          }}
                        >
                          {r.headline}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          {resumes.length > 0 && (
            <button
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={!selectedResumeId || applying}
            >
              {applying ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Recommended job card
// ---------------------------------------------------------------------------

function RecommendedCard({ job }: { job: JobListItem }) {
  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="job-card"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className="job-card__header">
        <div
          className="job-card__logo"
          style={
            {
              '--logo-bg': '#7928CA1A',
              '--logo-color': '#7928CA',
            } as React.CSSProperties
          }
        >
          {job.title[0]}
        </div>
        <div className="job-card__title-wrap">
          <div className="job-card__title">{job.title}</div>
          <div className="job-card__company">{job.company?.name}</div>
          <div className="job-card__location">
            {job.location && (
              <>
                <MapPin style={{ width: 11, height: 11 }} aria-hidden="true" /> {job.location}{' '}
                ·{' '}
              </>
            )}
            {LOCATION_TYPE_LABELS[job.location_type]}
          </div>
        </div>
        <button className="job-card__bookmark" title="Save job" onClick={(e) => e.preventDefault()}>
          <Bookmark size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="job-card__tags">
        <span className="job-card__tag">{LOCATION_TYPE_LABELS[job.location_type]}</span>
      </div>
      <div className="job-card__meta">
        <span>
          <Clock size={12} aria-hidden="true" />
          {formatDate(job.created_at)}
        </span>
        {job.location && (
          <span>
            <MapPin size={12} aria-hidden="true" />
            {job.location}
          </span>
        )}
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.job_id as string
  const [applying, setApplying] = useState(false)

  const { data: resp, isLoading, isError } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data

  // Fetching recommended jobs — same location_type, skip until job is loaded
  const { data: recResp } = useSearchJobsQuery(
    { location_type: job?.location_type, size: 7 },
    { skip: !job },
  )
  const recommended = (recResp?.data ?? []).filter((j) => j.id !== jobId).slice(0, 6)

  if (isLoading) {
    return (
      <div className="dash-content container dash-content--pad-top">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem',
            color: '#9ca3af',
          }}
        >
          Loading job details…
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="dash-content container dash-content--pad-top">
        <Link href="/dashboard/jobs" className="jd-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase style={{ width: 40, height: 40, color: '#9ca3af' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>
            This job could not be found or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)
  const isActive = job.status === 'active'

  return (
    <>
      <div className="dash-content container dash-content--pad-top">
        <Link href="/dashboard/jobs" className="jd-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>

        <div className="jd-page">
          {/* ── Hero ── */}
          <div className="jd-hero">
            <div
              className="jd-hero__cover"
              style={
                {
                  '--jd-from': 'rgba(0,112,243,0.18)',
                  '--jd-mid': 'rgba(121,40,202,0.12)',
                  '--jd-to': 'rgba(255,77,77,0.05)',
                } as React.CSSProperties
              }
            >
              <div
                className="jd-hero__logo"
                style={{ '--jd-logo': '#7928ca' } as React.CSSProperties}
              >
                {job.title[0]}
              </div>
            </div>

            <div className="jd-hero__body">
              <div className="jd-hero__info">
                <div className="jd-hero__date">Posted {formatDate(job.created_at)}</div>
                <h1 className="jd-hero__title">{job.title}</h1>
                <div className="jd-hero__company">
                  <Building size={13} aria-hidden="true" />
                  {job.company?.name}
                  {job.company?.industry && ` · ${job.company.industry}`}
                </div>
                <div className="jd-hero__location">
                  <MapPin size={14} aria-hidden="true" />
                  {job.location ?? 'Location not specified'} ·{' '}
                  {LOCATION_TYPE_LABELS[job.location_type]}
                </div>
              </div>

              <div className="jd-hero__apply-wrap">
                <button
                  className="jd-hero__apply-btn"
                  onClick={() => setApplying(true)}
                  disabled={!isActive}
                  title={
                    isActive
                      ? undefined
                      : job.status === 'draft'
                        ? 'This job is still in draft.'
                        : 'This job has expired.'
                  }
                >
                  <span>{isActive ? 'Apply Now' : getJobStatusLabel(job.status)}</span>
                </button>
                <button
                  style={{
                    background: 'none',
                    border: '1px solid #e4e4e7',
                    borderRadius: '9999px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(window.location.href)
                      .then(() => toast.info('Link copied!'))
                  }}
                >
                  <Share2 size={12} aria-hidden="true" />
                  Share
                </button>
              </div>
            </div>

            <div className="jd-hero__chips">
              <span className="jd-hero__chip jd-hero__chip--primary">
                <Briefcase size={12} aria-hidden="true" />
                {LOCATION_TYPE_LABELS[job.location_type]}
              </span>
              {salary && <span className="jd-hero__chip jd-hero__chip--secondary">{salary}</span>}
              <span className={`jd-hero__chip${isActive ? ' jd-hero__chip--success' : ''}`}>
                {getJobStatusLabel(job.status)}
              </span>
              <span className="jd-hero__chip">
                <Clock size={12} aria-hidden="true" />
                {formatDate(job.updated_at ?? job.created_at)}
              </span>
            </div>
          </div>

          {/* ── Overview ── */}
          {job.overview && (
            <div className="jd-section">
              <div className="jd-section__title">About the Role</div>
              <p className="jd-section__text">{job.overview}</p>
            </div>
          )}

          {/* ── Responsibilities ── */}
          {job.responsibilities.length > 0 && (
            <div className="jd-section">
              <div className="jd-section__title">Responsibilities</div>
              <ul className="jd-section__list">
                {job.responsibilities.map((item, i) => (
                  <li key={i} className="jd-section__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Requirements ── */}
          {job.requirements.length > 0 && (
            <div className="jd-section">
              <div className="jd-section__title">Requirements</div>
              <ul className="jd-section__list">
                {job.requirements.map((item, i) => (
                  <li key={i} className="jd-section__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Preferred Qualifications ── */}
          {job.preferred_qualifications.length > 0 && (
            <div className="jd-section">
              <div className="jd-section__title">Preferred Qualifications</div>
              <ul className="jd-section__list">
                {job.preferred_qualifications.map((item, i) => (
                  <li key={i} className="jd-section__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Benefits ── */}
          {job.benefits.length > 0 && (
            <div className="jd-section">
              <div className="jd-section__title">Benefits</div>
              <div className="jd-section__tags">
                {job.benefits.map((item, i) => (
                  <span key={i} className="jd-section__tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── About the Company ── */}
          <div className="jd-section">
            <div className="jd-section__title">About the Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: 'rgba(0,112,243,0.1)',
                    border: '1px solid rgba(0,112,243,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.375rem',
                    color: '#0070f3',
                    flexShrink: 0,
                  }}
                >
                  {job.company?.name[0] ?? job.title[0]}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      color: '#111827',
                      marginBottom: 2,
                    }}
                  >
                    {job.company?.name}
                  </div>
                  {job.company?.industry && (
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      {job.company.industry}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {job.company?.company_size && (
                  <span className="jd-hero__chip">
                    <Briefcase width={11} height={11} aria-hidden="true" />
                    {job.company.company_size} employees
                  </span>
                )}
                {job.company?.location && (
                  <span className="jd-hero__chip">
                    <MapPin width={11} height={11} aria-hidden="true" />
                    {job.company.location}
                  </span>
                )}
                {job.company?.website_url && (
                  <a
                    href={job.company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jd-hero__chip"
                    style={{ textDecoration: 'none', cursor: 'pointer' }}
                  >
                    Visit Website ↗
                  </a>
                )}
              </div>

              {job.company?.description && (
                <p className="jd-section__text">{job.company.description}</p>
              )}
            </div>
          </div>

          {/* ── Recommended Jobs ── */}
          {recommended.length > 0 && (
            <div className="jd-recommended">
              <h2 className="jd-recommended__title">Similar Jobs You Might Like</h2>
              <div className="jd-recommended__grid">
                {recommended.map((j) => (
                  <RecommendedCard key={j.id} job={j} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {applying && (
        <ApplyModal jobId={job.id} jobTitle={job.title} onClose={() => setApplying(false)} />
      )}
    </>
  )
}
