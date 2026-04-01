'use client'

import { toast } from 'react-toastify'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { type JobDetail, useGetJobByIdQuery } from '@/store/services/jobsApi'
import { ArrowLeft, Briefcase, Building, Clock, MapPin, Pencil, Share2 } from 'lucide-react'

import StatusPill from '@/components/common/StatusPill'

import { CompanyJobDetailSkeleton } from '../_components/CompanyJobsSkeletons'
import EvaluationSchemaBuilder from '../_components/EvaluationSchemaBuilder'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_TYPE_LABELS = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
} as const

function formatSalary(min?: number | null, max?: number | null, currency = 'USD'): string | null {
  if (!min && !max) return null
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  if (min) return `From ${currency} ${min.toLocaleString()}`
  return `Up to ${currency} ${max!.toLocaleString()}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecruiterJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const { data: resp, isLoading, isError, refetch } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data

  if (isLoading) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="jd-page-wrap">
          <Link href="/recruiter/jobs" className="jd-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
          <CompanyJobDetailSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="dash-content container container--app-shell">
        <Link href="/recruiter/jobs" className="jd-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase style={{ width: 40, height: 40, color: '#9ca3af' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>
            This job could not be found or you do not have permission to view it.
          </p>
          <button
            className="btn btn--outline btn--sm"
            style={{ marginTop: '1rem' }}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)

  return (
    <div className="dash-content container container--app-shell">
      <div className="jd-page-wrap">
        <Link href="/recruiter/jobs" className="jd-back">
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
                  className="btn btn--primary btn--md"
                  onClick={() => router.push(`/recruiter/jobs/${job.id}/edit`)}
                >
                  <Pencil size={16} aria-hidden="true" style={{ marginRight: '0.5rem' }} />
                  <span>Edit Job</span>
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

          <EvaluationSchemaBuilder jobId={job.id} />
        </div>
      </div>
    </div>
  )
}
