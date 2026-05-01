'use client'

import { useCallback } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { type JobDetail, useGetJobByIdQuery } from '@/store/services/jobsApi'
import { ArrowLeft, Briefcase, Building, Clock, MapPin, Pencil, Share2 } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import StatusPill from '@/components/common/StatusPill'

import { CompanyJobDetailSkeleton } from '../_components/CompanyJobsSkeletons'
import EvaluationSchemaBuilder from '../_components/EvaluationSchemaBuilder'
import JobPipelineWorkspace from './_components/JobPipelineWorkspace'

const VIEW_TABS = ['pipeline', 'description'] as const
type ViewTab = (typeof VIEW_TABS)[number]

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromChat = searchParams.get('from') === 'chat'
  const jobId = params.id as string

  const viewParam = searchParams.get('view')
  const activeView: ViewTab = (VIEW_TABS as readonly string[]).includes(viewParam ?? '')
    ? (viewParam as ViewTab)
    : 'pipeline'

  const setView = useCallback(
    (view: ViewTab) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('view', view)
      // When switching views, drop pipeline-specific state
      if (view === 'description') {
        next.delete('stage')
        next.delete('app')
        next.delete('tab')
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const { data: resp, isLoading, isError, refetch } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data

  if (isLoading) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="jd-page-wrap">
          {fromChat ? (
            <button type="button" className="jd-back" onClick={() => router.back()}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Chat
            </button>
          ) : (
            <Link href="/recruiter/jobs" className="jd-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Jobs
            </Link>
          )}
          <CompanyJobDetailSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="dash-content container container--app-shell">
        {fromChat ? (
          <button type="button" className="jd-back" onClick={() => router.back()}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Chat
          </button>
        ) : (
          <Link href="/recruiter/jobs" className="jd-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
        )}
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
        {fromChat ? (
          <button type="button" className="jd-back" onClick={() => router.back()}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Chat
          </button>
        ) : (
          <Link href="/recruiter/jobs" className="jd-back">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
        )}

        <div className="jd-page">
          {/* ── Hero ── */}
          <div className="jd-hero">
            <div className="jd-hero__body">
              <div className="jd-hero__info">
                <Avatar
                  name={job.company?.name ?? job.title}
                  src={job.company?.logo_url}
                  seed={job.company?.id ?? job.company?.name ?? job.title}
                  kind="company"
                  className="jd-hero__logo"
                  sizes="68px"
                  style={{ '--jd-logo': '#7928ca' } as React.CSSProperties}
                />
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
                <div className="job-meta jd-hero__chips">
                  <span className="job-meta__item">
                    <Briefcase size={11} aria-hidden="true" />
                    {LOCATION_TYPE_LABELS[job.location_type]}
                  </span>
                  {salary && (
                    <>
                      <span className="job-meta__sep" aria-hidden="true">
                        ·
                      </span>
                      <span className="job-meta__item job-meta__item--salary">{salary}</span>
                    </>
                  )}
                  <span className="job-meta__sep" aria-hidden="true">
                    ·
                  </span>
                  <StatusPill kind="job" status={job.status} />
                  <span className="job-meta__sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="job-meta__item job-meta__item--time">
                    <Clock size={11} aria-hidden="true" />
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

          {/* ── View tabs (Pipeline / Description) ── */}
          <div
            role="tablist"
            aria-label="Job view"
            style={{
              display: 'flex',
              gap: '0.25rem',
              borderBottom: '1px solid #e4e4e7',
              marginTop: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {VIEW_TABS.map((tab) => {
              const isActive = activeView === tab
              const label = tab === 'pipeline' ? 'Pipeline' : 'Description'
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setView(tab)}
                  style={{
                    background: 'none',
                    border: 0,
                    padding: '0.625rem 1rem',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-body)',
                    color: isActive ? 'var(--color-primary)' : '#6b7280',
                    cursor: 'pointer',
                    borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                    marginBottom: '-1px',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {activeView === 'pipeline' ? (
            <JobPipelineWorkspace jobId={job.id} />
          ) : (
            <>
              {/* ── Overview ── */}
              {job.overview && (
                <div className="jd-section">
                  <div className="jd-section__title">About the Role</div>
                  <p className="jd-section__text">{job.overview}</p>
                </div>
              )}
              <DescriptionSections job={job} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DescriptionSections({ job }: { job: JobDetail }) {
  return (
    <>
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
    </>
  )
}
