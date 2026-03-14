'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { type JobAIDraftRecord, useGetJobAIDraftsQuery } from '@/store/services/jobAiApi'
import {
  type JobListItem,
  type JobStatus,
  type LocationType,
  getJobStatusLabel,
  useDeleteJobMutation,
  useGetCompanyJobsQuery,
  useUpdateJobMutation,
} from '@/store/services/jobsApi'
import {
  Briefcase,
  Calendar,
  ChevronDown,
  DollarSign,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import DashboardTabs from '@/components/common/DashboardTabs'

import { CompanyJobsCardsSkeleton } from './_components/CompanyJobsSkeletons'

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

const FILTER_OPTIONS: { label: string; value: JobStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Expired', value: 'expired' },
]

const RECRUITER_JOBS_VIEW_KEY = 'recruiter-jobs-view'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatSalary(min?: number | null, max?: number | null, currency = 'NPR') {
  if (!min && !max) return 'Salary not specified'
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
  if (min) return `From ${currency} ${min.toLocaleString()}`
  return `Up to ${currency} ${max!.toLocaleString()}`
}

function getAIDraftStatusTone(status: string): JobStatus {
  if (status === 'approved') return 'active'
  if (status === 'rejected') return 'expired'
  return 'draft'
}

function getAIDraftStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'review_required':
      return 'Needs Review'
    case 'ready':
      return 'Ready'
    case 'saved':
      return 'Saved'
    case 'rejected':
      return 'Rejected'
    case 'drafting':
    default:
      return 'Drafting'
  }
}

function getAIDraftTitle(draft: JobAIDraftRecord) {
  return draft.latest_draft?.title?.trim() || draft.source_prompt?.trim() || 'Untitled AI draft'
}

function isVisibleAIDraft(draft: JobAIDraftRecord) {
  return draft.status !== 'committed'
}

function RecruiterJobCard({
  job,
  view,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus,
}: {
  job: JobListItem
  view: 'grid' | 'list'
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: JobStatus) => void
  isUpdatingStatus: boolean
}) {
  return (
    <div className={`company-job-card${view === 'grid' ? ' company-job-card--grid' : ''}`}>
      <div className="company-job-card__top-row">
        <label className={`company-job-card__status company-job-card__status--${job.status}`}>
          <select
            value={job.status}
            onChange={(event) => onStatusChange(event.target.value as JobStatus)}
            className="company-job-card__status-select"
            aria-label={`Change status for ${job.title}`}
            disabled={isUpdatingStatus}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="expired">Expired</option>
          </select>
          <ChevronDown size={13} aria-hidden="true" className="company-job-card__status-chevron" />
        </label>
      </div>

      <div className="company-job-card__title">{job.title}</div>

      <div className="company-job-card__location">
        <MapPin size={13} aria-hidden="true" />
        <span>
          {job.location ? `${job.location} · ` : ''}
          {LOCATION_TYPE_LABELS[job.location_type]}
        </span>
      </div>

      <div className="company-job-card__salary">
        <DollarSign size={13} aria-hidden="true" />
        <span>{formatSalary(job.salary_min, job.salary_max, job.currency)}</span>
      </div>

      <div className="company-job-card__divider" />

      <div className="company-job-card__footer">
        <div className="company-job-card__footer-meta">
          <Link
            href={`/recruiter/applications?job_id=${job.id}`}
            className="company-job-card__applicants-link"
          >
            <Users size={13} aria-hidden="true" />
            <span>
              {job.applications_count} Applicant{job.applications_count === 1 ? '' : 's'}
            </span>
          </Link>
          <span className="company-job-card__posted-date">
            <Calendar size={13} aria-hidden="true" />
            <span>Posted {formatDate(job.created_at)}</span>
          </span>
        </div>

        <div className="company-job-card__actions">
          <button
            type="button"
            className="company-job-card__icon-btn"
            onClick={onEdit}
            aria-label={`Edit ${job.title}`}
            title="Edit job"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="company-job-card__icon-btn company-job-card__icon-btn--danger"
            onClick={onDelete}
            aria-label={`Delete ${job.title}`}
            title="Delete job"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

function RecruiterAIDraftCard({ draft, view }: { draft: JobAIDraftRecord; view: 'grid' | 'list' }) {
  const jobDraft = draft.latest_draft
  const draftTitle = getAIDraftTitle(draft)
  const locationLabel = jobDraft?.location
    ? `${jobDraft.location} · ${LOCATION_TYPE_LABELS[jobDraft.location_type]}`
    : LOCATION_TYPE_LABELS[jobDraft?.location_type ?? 'remote']

  return (
    <div className={`company-job-card${view === 'grid' ? ' company-job-card--grid' : ''}`}>
      <div className="company-job-card__top-row">
        <span
          className={`company-job-card__status company-job-card__status--${getAIDraftStatusTone(draft.status)}`}
        >
          <span className="company-job-card__status-label">
            {getAIDraftStatusLabel(draft.status)}
          </span>
        </span>
      </div>

      <div className="company-job-card__title">{draftTitle}</div>

      <div className="company-job-card__location">
        <MapPin size={13} aria-hidden="true" />
        <span>{locationLabel}</span>
      </div>

      <div className="company-job-card__salary">
        <DollarSign size={13} aria-hidden="true" />
        <span>
          {formatSalary(jobDraft?.salary_min, jobDraft?.salary_max, jobDraft?.currency ?? 'NPR')}
        </span>
      </div>

      <div className="company-job-card__divider" />

      <div className="company-job-card__footer">
        <div className="company-job-card__footer-meta">
          <span className="company-job-card__posted-date">
            <Calendar size={13} aria-hidden="true" />
            <span>Updated {formatDate(draft.updated_at)}</span>
          </span>
          <span className="company-job-card__posted-date">
            <Sparkles size={13} aria-hidden="true" />
            <span>{draft.mode === 'clone' ? 'Cloned with AI' : 'Drafted with AI'}</span>
          </span>
        </div>

        <div className="company-job-card__actions">
          <Link
            href={`/recruiter/jobs/new?draftId=${draft.id}`}
            className="btn btn--outline btn--sm"
          >
            Open Draft
          </Link>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({
  jobTitle,
  onConfirm,
  onCancel,
  isLoading,
}: {
  jobTitle: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 420 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Delete Job</span>
          <button type="button" className="modal__close" onClick={onCancel} aria-label="Close">
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
            Are you sure you want to delete <strong>&ldquo;{jobTitle}&rdquo;</strong>? This action
            cannot be undone.
          </p>
        </div>
        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CompanyJobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterFromUrl = searchParams.get('filter')
  const [view, setView] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'list'
    const savedView = window.localStorage.getItem(RECRUITER_JOBS_VIEW_KEY)
    return savedView === 'grid' || savedView === 'list' ? savedView : 'list'
  })
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'all'>(
    filterFromUrl === 'active' || filterFromUrl === 'draft' || filterFromUrl === 'expired'
      ? filterFromUrl
      : 'all',
  )
  const [deletingJob, setDeletingJob] = useState<JobListItem | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const {
    data: jobsResp,
    isLoading: isLoadingJobs,
    isError: isJobsError,
    refetch: refetchJobs,
  } = useGetCompanyJobsQuery()
  const {
    data: draftsResp,
    isLoading: isLoadingDrafts,
    isError: isDraftsError,
    refetch: refetchDrafts,
  } = useGetJobAIDraftsQuery()
  const [updateJob] = useUpdateJobMutation()
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()

  const allJobs: JobListItem[] = jobsResp?.data ?? []
  const allAIDrafts = (draftsResp?.data ?? []).filter(isVisibleAIDraft)
  const visibleAIDrafts = activeFilter === 'draft' || activeFilter === 'all' ? allAIDrafts : []
  const filteredJobs =
    activeFilter === 'all' ? allJobs : allJobs.filter((job) => job.status === activeFilter)
  const isLoading = isLoadingJobs || isLoadingDrafts
  const isError = isJobsError || isDraftsError
  const hasVisibleItems = filteredJobs.length > 0 || visibleAIDrafts.length > 0

  function handleViewChange(nextView: 'grid' | 'list') {
    setView(nextView)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECRUITER_JOBS_VIEW_KEY, nextView)
    }
  }

  const counts: Record<JobStatus | 'all', number> = {
    all: allJobs.length + allAIDrafts.length,
    active: allJobs.filter((job) => job.status === 'active').length,
    draft: allJobs.filter((job) => job.status === 'draft').length + allAIDrafts.length,
    expired: allJobs.filter((job) => job.status === 'expired').length,
  }

  async function handleDeleteConfirm() {
    if (!deletingJob) return
    try {
      await deleteJob(deletingJob.id).unwrap()
      toast.success(`"${deletingJob.title}" deleted.`)
      setDeletingJob(null)
    } catch {
      toast.error('Failed to delete job.')
    }
  }

  async function handleStatusChange(job: JobListItem, nextStatus: JobStatus) {
    if (job.status === nextStatus) return

    try {
      setUpdatingStatusId(job.id)
      await updateJob({ id: job.id, status: nextStatus }).unwrap()
      toast.success(`${job.title} marked as ${getJobStatusLabel(nextStatus).toLowerCase()}.`)
    } catch {
      toast.error('Failed to update job status.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  function handleRefresh() {
    void refetchJobs()
    void refetchDrafts()
  }

  return (
    <>
      <div className="dash-content container container--app-shell">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Job Listings</h2>
            <p className="dash-page-header__subtitle">
              Manage your active, draft, and expired positions
            </p>
          </div>
          <div className="dash-page-header__actions">
            <button
              className={`btn btn--sm ${view === 'grid' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => handleViewChange('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} aria-hidden="true" />
            </button>
            <button
              className={`btn btn--sm ${view === 'list' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => handleViewChange('list')}
              aria-label="List view"
            >
              <List size={14} aria-hidden="true" />
            </button>
            <Link href="/recruiter/jobs/new" className="btn btn--outline btn--sm">
              <Plus size={14} aria-hidden="true" />
              AI Draft Job
            </Link>
            <Link href="/recruiter/jobs/manual" className="btn btn--primary btn--sm">
              <Plus size={14} aria-hidden="true" />
              Post Manually
            </Link>
          </div>
        </div>

        <div className="dash-filter-bar">
          <DashboardTabs
            options={FILTER_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
              count: counts[option.value],
            }))}
            activeValue={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        {isLoading ? (
          <CompanyJobsCardsSkeleton view={view} count={view === 'grid' ? 4 : 5} />
        ) : null}

        {isError ? (
          <div className="dash-card">
            <div className="dash-card__body">
              Failed to load jobs.{' '}
              <button className="auth__inline-link" onClick={handleRefresh}>
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && !hasVisibleItems ? (
          <div className="dash-card">
            <div className="company-jobs-empty">
              <Briefcase className="company-jobs-empty__icon" aria-hidden="true" />
              <div>
                <p className="company-jobs-empty__title">
                  {activeFilter === 'all'
                    ? 'No jobs yet'
                    : `No ${getJobStatusLabel(activeFilter)} jobs`}
                </p>
                <p className="company-jobs-empty__copy">
                  {activeFilter === 'all'
                    ? 'Post your first job to start attracting candidates.'
                    : `You have no ${getJobStatusLabel(activeFilter).toLowerCase()} job postings.`}
                </p>
              </div>
              {activeFilter === 'all' ? (
                <Link href="/recruiter/jobs/manual" className="btn btn--primary btn--sm">
                  Post New Job
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && hasVisibleItems ? (
          <div className={`company-jobs-cards company-jobs-cards--${view}`}>
            {visibleAIDrafts.map((draft) => (
              <RecruiterAIDraftCard key={`ai-${draft.id}`} draft={draft} view={view} />
            ))}
            {filteredJobs.map((job) => (
              <RecruiterJobCard
                key={job.id}
                job={job}
                view={view}
                onEdit={() => router.push(`/recruiter/jobs/${job.id}/edit`)}
                onDelete={() => setDeletingJob(job)}
                onStatusChange={(status) => handleStatusChange(job, status)}
                isUpdatingStatus={updatingStatusId === job.id}
              />
            ))}
          </div>
        ) : null}
      </div>

      {deletingJob ? (
        <DeleteConfirmModal
          jobTitle={deletingJob.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingJob(null)}
          isLoading={isDeleting}
        />
      ) : null}
    </>
  )
}
