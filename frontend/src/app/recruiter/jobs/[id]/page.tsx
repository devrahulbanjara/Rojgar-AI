'use client'

import { useCallback, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { formatSalary } from '@/lib/jobHelpers'
import {
  type JobDetail,
  type JobStatus,
  getJobStatusLabel,
  useCompleteHiringMutation,
  useDeleteJobMutation,
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from '@/store/services/jobsApi'
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Pencil,
  Share2,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import { FilterSelect } from '@/components/common/Toolbar'

import EvaluationSchemaBuilder from '../_components/EvaluationSchemaBuilder'
import JobPipelineWorkspace from './_components/JobPipelineWorkspace'

const VIEW_TABS = ['pipeline', 'description'] as const
type ViewTab = (typeof VIEW_TABS)[number]

const LOCATION_TYPE_LABELS = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
} as const

const JOB_STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'expired', label: 'Expired' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildSubtitle(job: JobDetail): string {
  const parts: string[] = []
  if (job.company?.name) parts.push(job.company.name)
  if (job.location) parts.push(job.location)
  parts.push(LOCATION_TYPE_LABELS[job.location_type])
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)
  if (salary) parts.push(salary)
  return parts.join(' · ')
}

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
  const [completeHiring, { isLoading: isCompletingHiring }] = useCompleteHiringMutation()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCompleteHiringModal, setShowCompleteHiringModal] = useState(false)

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

  async function handleCompleteHiringConfirm() {
    if (!job) return
    try {
      const resp = await completeHiring(job.id).unwrap()
      const rejected = resp.data?.rejected_application_count ?? 0
      toast.success(
        rejected > 0
          ? `Hiring complete. ${rejected} pending application${rejected === 1 ? '' : 's'} closed.`
          : 'Hiring complete.',
      )
      setShowCompleteHiringModal(false)
      void refetch()
    } catch {
      toast.error('Failed to complete hiring.')
    }
  }

  const backLink = fromChat ? (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      style={{ alignSelf: 'flex-start' }}
      onClick={() => router.back()}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back to Chat
    </button>
  ) : (
    <Link
      href="/recruiter/jobs"
      className="btn btn--ghost btn--sm"
      style={{ alignSelf: 'flex-start' }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back to Jobs
    </Link>
  )

  if (isLoading) {
    return (
      <div className="dash-content container container--app-shell">
        {backLink}
        <div className="jd-detail-header-skeleton" aria-hidden="true">
          <div className="jd-detail-header-skeleton__title" />
          <div className="jd-detail-header-skeleton__subtitle" />
        </div>
        <div className="jd-detail-tabs-skeleton" aria-hidden="true">
          <div />
          <div />
        </div>
        <div className="jd-detail">
          <div className="jd-detail__main">
            <div className="jd-detail__skeleton-section" />
            <div className="jd-detail__skeleton-section" />
            <div className="jd-detail__skeleton-section" />
          </div>
          <div className="jd-detail__sidebar">
            <div className="jd-detail__skeleton-sidebar" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="dash-content container container--app-shell">
        {backLink}
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Job not found</h2>
            <p className="dash-page-header__subtitle">
              This job could not be found or you do not have permission to view it.
            </p>
          </div>
        </div>
        <button
          className="btn btn--secondary btn--sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => void refetch()}
        >
          Try again
        </button>
      </div>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)

  return (
    <>
      <div className="dash-content container container--app-shell">
        {backLink}

        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">{job.title}</h2>
            <p className="dash-page-header__subtitle">{buildSubtitle(job)}</p>
          </div>
          <div className="dash-page-header__actions">
            {job.hiring_completed ? (
              <span
                className="status-pill status-pill--success"
                title={job.hired_at ? `Hiring completed on ${formatDate(job.hired_at)}` : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'var(--color-success-50, #ecfdf5)',
                  color: 'var(--color-success-700, #047857)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                Hired{job.hired_at ? ` · ${formatDate(job.hired_at)}` : ''}
              </span>
            ) : (
              <>
                <FilterSelect<JobStatus>
                  value={job.status}
                  onChange={(next) => void handleStatusChange(next)}
                  options={JOB_STATUS_OPTIONS}
                  ariaLabel="Change job status"
                  disabled={isUpdatingStatus}
                />
                <button
                  className="btn btn--success btn--sm"
                  onClick={() => setShowCompleteHiringModal(true)}
                  title="Mark hiring as complete and close this job"
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Complete Hiring
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => router.push(`/recruiter/jobs/${job.id}/edit`)}
                >
                  <Pencil size={14} aria-hidden="true" />
                  Edit Job
                </button>
              </>
            )}
            <button
              className="btn btn--icon btn--sm"
              onClick={() => {
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => toast.info('Link copied!'))
              }}
              aria-label="Share link"
            >
              <Share2 size={16} />
            </button>
            {!job.hiring_completed && (
              <button
                className="btn btn--icon btn--sm"
                onClick={() => setShowDeleteModal(true)}
                aria-label="Delete job"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="team-tabs" role="tablist" aria-label="Job view">
          {VIEW_TABS.map((tab) => {
            const isActive = activeView === tab
            const label = tab === 'pipeline' ? 'Pipeline' : 'Description'
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`team-tabs__btn ${isActive ? 'team-tabs__btn--active' : ''}`}
                onClick={() => setView(tab)}
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
            <div className="jd-detail">
              <div className="jd-detail__main">
                {job.overview && (
                  <section className="jd-detail__section">
                    <h3 className="jd-detail__heading">About the Role</h3>
                    <p className="jd-detail__text">{job.overview}</p>
                  </section>
                )}
                <DescriptionSections job={job} />
              </div>

              <aside className="jd-detail__sidebar">
                <div className="jd-detail__sidebar-card">
                  <div className="jd-detail__sidebar-section">
                    <Avatar
                      name={job.company?.name ?? job.title}
                      src={job.company?.logo_url}
                      seed={job.company?.id ?? job.company?.name ?? job.title}
                      kind="company"
                      className="jd-detail__sidebar-logo"
                      sizes="48px"
                    />
                    <span className="jd-detail__sidebar-company">
                      {job.company?.name ?? 'Unknown'}
                    </span>
                    {job.company?.industry && (
                      <span className="jd-detail__sidebar-industry">{job.company.industry}</span>
                    )}
                  </div>

                  <dl className="jd-detail__meta">
                    <div className="jd-detail__meta-row">
                      <dt>
                        <MapPin aria-hidden="true" /> Location
                      </dt>
                      <dd>{job.location ?? 'Not specified'}</dd>
                    </div>
                    <div className="jd-detail__meta-row">
                      <dt>
                        <Briefcase aria-hidden="true" /> Work Type
                      </dt>
                      <dd>{LOCATION_TYPE_LABELS[job.location_type]}</dd>
                    </div>
                    {salary && (
                      <div className="jd-detail__meta-row">
                        <dt>
                          <DollarSign aria-hidden="true" /> Salary
                        </dt>
                        <dd>{salary}</dd>
                      </div>
                    )}
                    <div className="jd-detail__meta-row">
                      <dt>
                        <Clock aria-hidden="true" /> Posted
                      </dt>
                      <dd>{formatDate(job.created_at)}</dd>
                    </div>
                    <div className="jd-detail__meta-row">
                      <dt>
                        <Users aria-hidden="true" /> Applicants
                      </dt>
                      <dd>{job.applications_count}</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>

            <EvaluationSchemaBuilder jobId={job.id} readOnly />
          </>
        )}
      </div>

      {showCompleteHiringModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <span className="modal__title">Complete hiring for this job?</span>
              <button
                type="button"
                className="btn btn--icon btn--sm"
                onClick={() => setShowCompleteHiringModal(false)}
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
                This will close <strong>&ldquo;{job.title}&rdquo;</strong>, automatically reject all
                pending applicants (with reason: <em>position filled</em>), and remove the job from
                candidate search. Offers already extended will not be affected.{' '}
                <strong>This cannot be undone.</strong>
              </p>
            </div>
            <div className="modal__footer">
              <button
                type="button"
className="btn btn--danger btn--sm"
                onClick={() => setShowCompleteHiringModal(false)}
                disabled={isCompletingHiring}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn--primary btn--sm${isCompletingHiring ? ' btn--loading' : ''}`}
                onClick={handleCompleteHiringConfirm}
                disabled={isCompletingHiring}
                aria-busy={isCompletingHiring}
              >
                {isCompletingHiring ? 'Completing...' : 'Complete hiring'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" onClick={(event) => event.stopPropagation()}>
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
                className={`btn btn--danger btn--sm${isDeleting ? ' btn--loading' : ''}`}
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
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
      {job.responsibilities.length > 0 && (
        <section className="jd-detail__section">
          <h3 className="jd-detail__heading">Responsibilities</h3>
          <ul className="jd-detail__list">
            {job.responsibilities.map((item, i) => (
              <li key={i} className="jd-detail__list-item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {job.requirements.length > 0 && (
        <section className="jd-detail__section">
          <h3 className="jd-detail__heading">Requirements</h3>
          <ul className="jd-detail__list">
            {job.requirements.map((item, i) => (
              <li key={i} className="jd-detail__list-item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {job.preferred_qualifications.length > 0 && (
        <section className="jd-detail__section">
          <h3 className="jd-detail__heading">Preferred Qualifications</h3>
          <ul className="jd-detail__list">
            {job.preferred_qualifications.map((item, i) => (
              <li key={i} className="jd-detail__list-item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {job.benefits.length > 0 && (
        <section className="jd-detail__section">
          <h3 className="jd-detail__heading">Benefits</h3>
          <ul className="jd-detail__list">
            {job.benefits.map((item, i) => (
              <li key={i} className="jd-detail__list-item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
