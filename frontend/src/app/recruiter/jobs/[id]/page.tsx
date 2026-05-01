'use client'

import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  type JobDetail,
  type JobStatus,
  getJobStatusLabel,
  useDeleteJobMutation,
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from '@/store/services/jobsApi'
import {
  ArrowLeft,
  Briefcase,
  Building,
  Clock,
  MapPin,
  Pencil,
  Share2,
  Trash2,
  X,
} from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import ButtonSpinner from '@/components/common/ButtonSpinner'

import { CompanyJobDetailSkeleton } from '../_components/CompanyJobsSkeletons'
import EvaluationSchemaBuilder from '../_components/EvaluationSchemaBuilder'
import listStyles from '../page.module.scss'
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

  const [updateJob, { isLoading: isUpdatingStatus }] = useUpdateJobMutation()
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handleStatusChange(nextStatus: JobStatus) {
    if (!job || job.status === nextStatus) return
    try {
      await updateJob({ id: job.id, status: nextStatus }).unwrap()
      toast.success(`Marked as ${getJobStatusLabel(nextStatus).toLowerCase()}.`)
    } catch {
      toast.error('Failed to update job status.')
    }
  }

  async function handleDeleteConfirm() {
    if (!job) return
    try {
      await deleteJob(job.id).unwrap()
      toast.success(`"${job.title}" deleted.`)
      router.push('/recruiter/jobs')
    } catch {
      toast.error('Failed to delete job.')
    }
  }

  if (isLoading) {
    return (
      <div className="dash-content container container--app-shell">
        <div className="jd-page-wrap">
          {fromChat ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => router.back()}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Chat
            </button>
          ) : (
            <Link href="/recruiter/jobs" className="btn btn--ghost btn--sm">
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
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => router.back()}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Chat
          </button>
        ) : (
          <Link href="/recruiter/jobs" className="btn btn--ghost btn--sm">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
        )}
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase style={{ width: 40, height: 40, color: '#9ca3af' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>
            This job could not be found or you do not have permission to view it.
          </p>
          <button className="btn btn--secondary btn--sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)

  return (
    <>
      <div className="dash-content container container--app-shell">
        <div className="jd-page-wrap">
          {fromChat ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => router.back()}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Chat
            </button>
          ) : (
            <Link href="/recruiter/jobs" className="btn btn--ghost btn--sm">
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
                    <select
                      className={listStyles.detailStatusSelect}
                      value={job.status}
                      onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                      disabled={isUpdatingStatus}
                      aria-label="Change job status"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="expired">Expired</option>
                    </select>
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
                    className="btn btn--primary"
                    onClick={() => router.push(`/recruiter/jobs/${job.id}/edit`)}
                  >
                    <Pencil size={16} aria-hidden="true" style={{ marginRight: '0.5rem' }} />
                    <span>Edit Job</span>
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(window.location.href)
                        .then(() => toast.info('Link copied!'))
                    }}
                  >
                    <Share2 size={12} aria-hidden="true" />
                    Share
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setShowDeleteModal(true)}
                    aria-label="Delete job"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    Delete
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
      {showDeleteModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div
            className="modal"
            style={{ maxWidth: 420 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <span className="modal__title">Delete Job</span>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <div className="modal__body">
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--color-gray-700,#374151)',
                  lineHeight: 1.6,
                }}
              >
                Are you sure you want to delete <strong>&ldquo;{job.title}&rdquo;</strong>? This
                action cannot be undone.
              </p>
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? <ButtonSpinner label="Deleting..." /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
