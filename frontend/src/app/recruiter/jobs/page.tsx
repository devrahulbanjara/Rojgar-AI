'use client'

import { useEffect, useRef, useState } from 'react'
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
  DollarSign,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import ButtonSpinner from '@/components/common/ButtonSpinner'

import styles from './page.module.scss'

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

function formatSalary(min?: number | null, max?: number | null, currency = 'NPR') {
  if (!min && !max) return 'Salary not specified'
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
  if (min) return `From ${currency} ${min.toLocaleString()}`
  return `Up to ${currency} ${max!.toLocaleString()}`
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

function StatusSelect({
  status,
  onChange,
  disabled,
  jobTitle,
}: {
  status: JobStatus
  onChange: (next: JobStatus) => void
  disabled: boolean
  jobTitle: string
}) {
  return (
    <select
      className={styles.statusSelect}
      value={status}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={`Change status for ${jobTitle}`}
    >
      <option value="active">Active</option>
      <option value="draft">Draft</option>
      <option value="expired">Expired</option>
    </select>
  )
}

function KebabMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  return (
    <div ref={wrapRef} className={styles.kebabWrap} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={styles.kebabBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Job actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className={`${styles.menu} ${styles['menu--up']}`} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
          >
            <Pencil size={14} aria-hidden="true" />
            Edit job
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${styles['menuItem--danger']}`}
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete job
          </button>
        </div>
      ) : null}
    </div>
  )
}

function RecruiterJobCard({
  job,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus,
}: {
  job: JobListItem
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: JobStatus) => void
  isUpdatingStatus: boolean
}) {
  const router = useRouter()

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/recruiter/jobs/${job.id}`)
      }}
    >
      <div className={styles.cardHead}>
        <h3 className={styles.title}>{job.title}</h3>
        <StatusSelect
          status={job.status}
          onChange={onStatusChange}
          disabled={isUpdatingStatus}
          jobTitle={job.title}
        />
      </div>

      <div className={styles.row}>
        <MapPin size={13} aria-hidden="true" />
        <span>
          {job.location ? `${job.location} · ` : ''}
          {LOCATION_TYPE_LABELS[job.location_type]}
        </span>
      </div>

      <div className={styles.salary}>
        <DollarSign size={13} aria-hidden="true" />
        <span>{formatSalary(job.salary_min, job.salary_max, job.currency)}</span>
      </div>

      <div className={styles.applicants}>
        <Users size={13} aria-hidden="true" />
        <span>
          {job.applications_count} Applicant{job.applications_count === 1 ? '' : 's'}
        </span>
      </div>

      <KebabMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

function RecruiterAIDraftCard({ draft }: { draft: JobAIDraftRecord }) {
  const router = useRouter()
  const jobDraft = draft.latest_draft
  const draftTitle = getAIDraftTitle(draft)
  const locationLabel = jobDraft?.location
    ? `${jobDraft.location} · ${LOCATION_TYPE_LABELS[jobDraft.location_type]}`
    : LOCATION_TYPE_LABELS[jobDraft?.location_type ?? 'remote']

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/recruiter/jobs/new?draftId=${draft.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/recruiter/jobs/new?draftId=${draft.id}`)
      }}
    >
      <div className={styles.cardHead}>
        <h3 className={styles.title}>{draftTitle}</h3>
        <span className={styles.statusText}>{getAIDraftStatusLabel(draft.status)}</span>
      </div>

      <div className={styles.row}>
        <MapPin size={13} aria-hidden="true" />
        <span>{locationLabel}</span>
      </div>

      <div className={styles.salary}>
        <DollarSign size={13} aria-hidden="true" />
        <span>
          {formatSalary(jobDraft?.salary_min, jobDraft?.salary_max, jobDraft?.currency ?? 'NPR')}
        </span>
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
          <button
            type="button"
            className="btn btn--icon btn--sm"
            onClick={onCancel}
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
            {isLoading ? <ButtonSpinner label="Deleting..." /> : 'Delete'}
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
      <div className={`dash-content container container--app-shell ${styles.page}`}>
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Job Listings</h2>
            <p className="dash-page-header__subtitle">
              Manage your active, draft, and expired positions
            </p>
          </div>
          <div className="dash-page-header__actions">
            <Link href="/recruiter/jobs/new" className="btn btn--secondary btn--sm">
              <Plus size={14} aria-hidden="true" />
              AI Draft Job
            </Link>
            <Link href="/recruiter/jobs/manual" className="btn btn--primary btn--sm">
              <Plus size={14} aria-hidden="true" />
              Post Manually
            </Link>
          </div>
        </div>

        <div className="team-tabs" role="tablist" aria-label="Job filters">
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.value
            const count = counts[option.value]
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`team-tabs__btn ${isActive ? 'team-tabs__btn--active' : ''}`}
                onClick={() => setActiveFilter(option.value)}
              >
                <span>{option.label}</span>
                {count > 0 ? <span className="team-tabs__count">{count}</span> : null}
              </button>
            )
          })}
        </div>

        {isLoading ? (
          <div className={styles.skeleton}>
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        ) : null}

        {isError ? (
          <div className={styles.empty}>
            <Briefcase className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Failed to load jobs</p>
            <button className="btn btn--secondary btn--sm" onClick={handleRefresh}>
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && !hasVisibleItems ? (
          <div className={styles.empty}>
            <Briefcase className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>
              {activeFilter === 'all'
                ? 'No jobs yet'
                : `No ${getJobStatusLabel(activeFilter)} jobs`}
            </p>
            <p className={styles.emptyCopy}>
              {activeFilter === 'all'
                ? 'Post your first job to start attracting candidates.'
                : `You have no ${getJobStatusLabel(activeFilter).toLowerCase()} job postings.`}
            </p>
            {activeFilter === 'all' ? (
              <Link href="/recruiter/jobs/manual" className="btn btn--primary btn--sm">
                <Plus size={14} aria-hidden="true" />
                Create Job
              </Link>
            ) : null}
          </div>
        ) : null}

        {!isLoading && !isError && hasVisibleItems ? (
          <div className={styles.grid}>
            {visibleAIDrafts.map((draft) => (
              <RecruiterAIDraftCard key={`ai-${draft.id}`} draft={draft} />
            ))}
            {filteredJobs.map((job) => (
              <RecruiterJobCard
                key={job.id}
                job={job}
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
