'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  type JobDetail,
  type JobListItem,
  type LocationType,
  getJobStatusLabel,
  useGetJobByIdQuery,
  useSearchJobsQuery,
} from '@/store/services/jobsApi'
import { ArrowLeft, Banknote, Briefcase, Building, Clock, MapPin, Share2 } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'
import StatusPill from '@/components/common/StatusPill'
import ApplyFlowModal from '@/components/jobs/ApplyModal'

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

function formatSalaryRange(job: JobListItem): string {
  if (job.salary_min == null && job.salary_max == null) return 'Salary not specified'
  if (job.salary_min != null && job.salary_max != null) {
    return `${job.currency} ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min != null) {
    return `${job.currency} ${job.salary_min.toLocaleString()}+`
  }
  return `Up to ${job.currency} ${job.salary_max!.toLocaleString()}`
}

function getCompanyAccent(name: string): { logo: string; color: string } {
  const palette = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    logo: name.trim().charAt(0).toUpperCase() || 'C',
    color: palette[seed % palette.length],
  }
}

function getRecommendedJobTags(job: JobListItem): string[] {
  return [job.location_type, job.company?.industry]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
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
  onSuccess,
}: {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess?: () => void
}) {
  return (
    <ApplyFlowModal
      isOpen={true}
      jobId={jobId}
      jobTitle={jobTitle}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

// ---------------------------------------------------------------------------
// Recommended job card
// ---------------------------------------------------------------------------

function RecommendedCard({ job, index }: { job: JobListItem; index: number }) {
  const accent = getCompanyAccent(job.company?.name ?? job.title)
  const tags = getRecommendedJobTags(job)

  return (
    <Link
      href={`/candidate/jobs/${job.id}`}
      className="job-card job-card--recommended content-stagger-item"
      style={{ '--stagger-index': index, textDecoration: 'none' } as React.CSSProperties}
    >
      <div className="job-card__header">
        <MediaBadge
          src={job.company?.logo_url}
          alt={job.company?.name ?? job.title}
          fallback={accent.logo}
          className="job-card__logo"
          sizes="40px"
          style={
            {
              '--logo-bg': accent.color + '1A',
              '--logo-color': accent.color,
            } as React.CSSProperties
          }
        />
        <div className="job-card__title-wrap">
          <div className="job-card__title">{job.title}</div>
          <div className="job-card__company">
            <span className="job-card__company-name">{job.company?.name}</span>
            <span className="job-card__location job-card__location--inline">
              <span className="job-card__location-sep">·</span>
              <span>{job.location ?? job.location_type}</span>
            </span>
          </div>
        </div>
        {job.match_score !== null && (
          <div className="badge badge--primary badge--xs" title="AI Match Score">
            {Math.round(job.match_score * 100)}%
          </div>
        )}
      </div>
      <div className="job-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="badge badge--gray">
            {tag}
          </span>
        ))}
      </div>
      <div className="job-card__meta">
        <span>
          <Banknote size={12} aria-hidden="true" />
          {formatSalaryRange(job)}
        </span>
        <span className="btn btn--primary btn--sm job-card__meta-time">View</span>
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

  const { data: resp, isLoading, isError, refetch } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data

  const { data: jobsResp } = useSearchJobsQuery({ size: 7 })
  const recommended = (jobsResp?.data?.items ?? []).filter((j) => j.id !== jobId).slice(0, 6)

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
        <Link href="/candidate/jobs" className="jd-back">
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
  const hasApplied = job.has_applied

  return (
    <>
      <div className="dash-content container dash-content--pad-top">
        <Link href="/candidate/jobs" className="jd-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>

        <div className="jd-page">
          {/* ── Hero ── */}
          <div className="jd-hero">
            <div className="jd-hero__body">
              <div className="jd-hero__info">
                <div
                  className="jd-hero__logo"
                  style={{ '--jd-logo': '#7928ca' } as React.CSSProperties}
                >
                  {job.company?.logo_url ? (
                    <Image
                      src={job.company.logo_url}
                      alt={job.company.name}
                      fill
                      sizes="68px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    job.title[0]
                  )}
                </div>
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
                <div className="jd-hero__chips">
                  <span className="badge badge--primary">
                    <Briefcase size={12} aria-hidden="true" />
                    {LOCATION_TYPE_LABELS[job.location_type]}
                  </span>
                  {salary && <span className="badge badge--secondary">{salary}</span>}
                  <StatusPill kind="job" status={job.status} />
                  <span className="badge badge--gray">
                    <Clock size={12} aria-hidden="true" />
                    Posted {formatDate(job.updated_at ?? job.created_at)}
                  </span>
                </div>
              </div>

              <div className="jd-hero__apply-wrap">
                <button
                  className="jd-hero__apply-btn"
                  onClick={() => {
                    if (!hasApplied) {
                      setApplying(true)
                    }
                  }}
                  disabled={!isActive || hasApplied}
                  title={
                    hasApplied
                      ? 'You have already applied to this job.'
                      : isActive
                        ? undefined
                        : job.status === 'draft'
                          ? 'This job is still in draft.'
                          : 'This job has expired.'
                  }
                >
                  <span>
                    {hasApplied
                      ? 'Applied'
                      : isActive
                        ? 'Apply Now'
                        : getJobStatusLabel(job.status)}
                  </span>
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
              <ul className="jd-section__list">
                {job.benefits.map((item, i) => (
                  <li key={i} className="jd-section__list-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── About the Company ── */}
          <div className="jd-section">
            <div className="jd-section__title">About the Company</div>
            <div className="jd-section__content">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                }}
              >
                <div
                  style={{
                    position: 'relative',
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
                    overflow: 'hidden',
                  }}
                >
                  {job.company?.logo_url ? (
                    <Image
                      src={job.company.logo_url}
                      alt={job.company.name}
                      fill
                      sizes="52px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    (job.company?.name[0] ?? job.title[0])
                  )}
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
                  <span className="badge badge--gray">
                    <Briefcase width={11} height={11} aria-hidden="true" />
                    {job.company.company_size} employees
                  </span>
                )}
                {job.company?.location && (
                  <span className="badge badge--gray">
                    <MapPin width={11} height={11} aria-hidden="true" />
                    {job.company.location}
                  </span>
                )}
                {job.company?.website_url && (
                  <a
                    href={job.company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge--secondary"
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
            <div className="dash-card">
              <div className="dash-card__header">
                <div>
                  <div className="dash-card__title">Recommended for You</div>
                  <div className="dash-card__subtitle">Based on your profile and skills</div>
                </div>
                <Link href="/candidate/jobs" className="btn btn--outline btn--sm">
                  Browse All Jobs
                </Link>
              </div>
              <div className="dash-card__body dash-card__body--recommended-jobs">
                <div className="recommended-jobs-grid">
                  {recommended.map((j, index: number) => (
                    <RecommendedCard key={j.id} job={j} index={index} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {applying && (
        <ApplyModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setApplying(false)}
          onSuccess={() => {
            void refetch()
          }}
        />
      )}
    </>
  )
}
