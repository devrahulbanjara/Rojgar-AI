'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'

import {
  type CreateJobPayload,
  type JobDetail,
  type JobListItem,
  type JobStatus,
  type LocationType,
  getJobStatusLabel,
  useCreateJobMutation,
  useDeleteJobMutation,
  useGetCompanyJobsQuery,
  useGetJobByIdQuery,
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
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { CompanyJobsCardsSkeleton } from './_components/CompanyJobsSkeletons'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

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

function formatCategory(category: string | null) {
  if (!category) return 'General'
  return category
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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
        <span className="company-job-card__category">{formatCategory(job.category)}</span>
        <label className={`company-job-card__status company-job-card__status--${job.status}`}>
          <select
            value={job.status}
            onChange={(e) => onStatusChange(e.target.value as JobStatus)}
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

// ---------------------------------------------------------------------------
// Dynamic list input (responsibilities, requirements, etc.)
// ---------------------------------------------------------------------------

function ListInput({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string
  placeholder: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const t = draft.trim()
    if (!t) return
    onChange([...items, t])
    setDraft('')
  }

  return (
    <div className="auth__field">
      <label className="auth__label">{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="auth__input"
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn--primary btn--sm" onClick={add}>
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul
          style={{
            margin: '0.5rem 0 0',
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {items.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--color-gray-700,#374151)',
                background: 'var(--color-gray-50,#f9fafb)',
                border: '1px solid var(--color-gray-200,#e5e7eb)',
                borderRadius: '0.375rem',
                padding: '0.375rem 0.625rem',
              }}
            >
              <span style={{ flex: 1 }}>{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ef4444',
                  padding: 0,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label={`Remove "${item}"`}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Job form
// ---------------------------------------------------------------------------

interface JobFormState {
  title: string
  location: string
  location_type: LocationType
  salary_min: string
  salary_max: string
  currency: string
  status: JobStatus
  overview: string
  responsibilities: string[]
  requirements: string[]
  preferred_qualifications: string[]
  benefits: string[]
}

const EMPTY_FORM: JobFormState = {
  title: '',
  location: '',
  location_type: 'onsite',
  salary_min: '',
  salary_max: '',
  currency: 'USD',
  status: 'draft',
  overview: '',
  responsibilities: [],
  requirements: [],
  preferred_qualifications: [],
  benefits: [],
}

function formFromDetail(d: JobDetail): JobFormState {
  return {
    title: d.title,
    location: d.location ?? '',
    location_type: d.location_type,
    salary_min: d.salary_min != null ? String(d.salary_min) : '',
    salary_max: d.salary_max != null ? String(d.salary_max) : '',
    currency: d.currency,
    status: d.status,
    overview: d.overview ?? '',
    responsibilities: d.responsibilities ?? [],
    requirements: d.requirements ?? [],
    preferred_qualifications: d.preferred_qualifications ?? [],
    benefits: d.benefits ?? [],
  }
}

function formToPayload(f: JobFormState): CreateJobPayload {
  return {
    title: f.title,
    ...(f.location && { location: f.location }),
    location_type: f.location_type,
    ...(f.salary_min && { salary_min: Number(f.salary_min) }),
    ...(f.salary_max && { salary_max: Number(f.salary_max) }),
    currency: f.currency || 'USD',
    status: f.status,
    ...(f.overview && { overview: f.overview }),
    responsibilities: f.responsibilities,
    requirements: f.requirements,
    preferred_qualifications: f.preferred_qualifications,
    benefits: f.benefits,
  }
}

function JobFormModal({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: {
  initial?: JobFormState
  onSubmit: (payload: CreateJobPayload) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  submitLabel: string
}) {
  const [form, setForm] = useState<JobFormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormState, string>>>({})

  function set<K extends keyof JobFormState>(key: K, value: JobFormState[K]) {
    setForm((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Partial<Record<keyof JobFormState, string>> = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max))
      errs.salary_min = 'Min salary cannot exceed max.'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    await onSubmit(formToPayload(form))
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div
        className="modal"
        style={{ maxWidth: 680, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <span className="modal__title">{submitLabel}</span>
          <button type="button" className="modal__close" onClick={onCancel} aria-label="Close">
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal__body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {/* Title */}
            <div className="auth__field">
              <label className="auth__label">
                Job Title <span className="auth__required">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className={`auth__input${errors.title ? ' auth__input--error' : ''}`}
              />
              {errors.title && (
                <span className="auth__error-msg" role="alert">
                  {errors.title}
                </span>
              )}
            </div>

            {/* Location + Work type */}
            <div className="auth__field-grid">
              <div className="auth__field">
                <label className="auth__label">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="e.g. Kathmandu, Nepal"
                  className="auth__input"
                />
              </div>
              <div className="auth__field">
                <label className="auth__label">Work Type</label>
                <select
                  value={form.location_type}
                  onChange={(e) => set('location_type', e.target.value as LocationType)}
                  className="auth__input auth__input--select"
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Salary */}
            <div className="auth__field-grid" style={{ gridTemplateColumns: '1fr 1fr 0.6fr' }}>
              <div className="auth__field">
                <label className="auth__label">Min Salary</label>
                <input
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => set('salary_min', e.target.value)}
                  placeholder="e.g. 60000"
                  min={0}
                  className={`auth__input${errors.salary_min ? ' auth__input--error' : ''}`}
                />
                {errors.salary_min && (
                  <span className="auth__error-msg" role="alert">
                    {errors.salary_min}
                  </span>
                )}
              </div>
              <div className="auth__field">
                <label className="auth__label">Max Salary</label>
                <input
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => set('salary_max', e.target.value)}
                  placeholder="e.g. 90000"
                  min={0}
                  className="auth__input"
                />
              </div>
              <div className="auth__field">
                <label className="auth__label">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className="auth__input auth__input--select"
                >
                  <option value="USD">USD</option>
                  <option value="NPR">NPR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="auth__field">
              <label className="auth__label">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as JobStatus)}
                className="auth__input auth__input--select"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Overview */}
            <div className="auth__field">
              <label className="auth__label">
                Job Overview <span className="auth__optional">(optional)</span>
              </label>
              <textarea
                value={form.overview}
                onChange={(e) => set('overview', e.target.value)}
                placeholder="Brief summary of the role and team…"
                rows={3}
                className="auth__textarea"
              />
            </div>

            <ListInput
              label="Responsibilities"
              placeholder="Add a responsibility and press Enter…"
              items={form.responsibilities}
              onChange={(v) => set('responsibilities', v)}
            />
            <ListInput
              label="Requirements"
              placeholder="Add a requirement and press Enter…"
              items={form.requirements}
              onChange={(v) => set('requirements', v)}
            />
            <ListInput
              label="Preferred Qualifications"
              placeholder="Add preferred qualification and press Enter…"
              items={form.preferred_qualifications}
              onChange={(v) => set('preferred_qualifications', v)}
            />
            <ListInput
              label="Benefits"
              placeholder="Add a benefit and press Enter…"
              items={form.benefits}
              onChange={(v) => set('benefits', v)}
            />
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
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Delete confirmation
// ---------------------------------------------------------------------------

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
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
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
            className="btn btn--error btn--sm"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit modal — fetches full job detail then renders the form
// ---------------------------------------------------------------------------

function EditJobModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { data: resp, isLoading: isLoadingDetail } = useGetJobByIdQuery(jobId)
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation()

  if (isLoadingDetail) {
    return (
      <div className="modal-backdrop">
        <div className="modal" style={{ maxWidth: 680 }}>
          <div className="modal__body" style={{ alignItems: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-muted,#6b7280)' }}>Loading job details…</p>
          </div>
        </div>
      </div>
    )
  }

  const detail = resp?.data
  if (!detail) return null

  async function handleUpdate(payload: CreateJobPayload) {
    try {
      await updateJob({ id: jobId, ...payload }).unwrap()
      toast.success('Job updated successfully.')
      onClose()
    } catch {
      toast.error('Failed to update job. Please try again.')
    }
  }

  return (
    <JobFormModal
      initial={formFromDetail(detail)}
      onSubmit={handleUpdate}
      onCancel={onClose}
      isLoading={isUpdating}
      submitLabel="Update Job"
    />
  )
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { label: string; value: JobStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Expired', value: 'expired' },
]

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CompanyJobsPage() {
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [deletingJob, setDeletingJob] = useState<JobListItem | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const { data: resp, isLoading, isError, refetch } = useGetCompanyJobsQuery()
  const [createJob, { isLoading: isCreating }] = useCreateJobMutation()
  const [updateJob] = useUpdateJobMutation()
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()

  const allJobs: JobListItem[] = resp?.data ?? []
  const filteredJobs =
    activeFilter === 'all' ? allJobs : allJobs.filter((j) => j.status === activeFilter)

  const counts: Record<JobStatus | 'all', number> = {
    all: allJobs.length,
    active: allJobs.filter((j) => j.status === 'active').length,
    draft: allJobs.filter((j) => j.status === 'draft').length,
    expired: allJobs.filter((j) => j.status === 'expired').length,
  }

  async function handleCreate(payload: CreateJobPayload) {
    try {
      await createJob(payload).unwrap()
      toast.success('Job posted successfully.')
      setShowCreate(false)
    } catch {
      toast.error('Failed to create job. Please try again.')
    }
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

  return (
    <>
      <div className="dash-content container">
        {/* Header */}
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
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} aria-hidden="true" />
            </button>
            <button
              className={`btn btn--sm ${view === 'list' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setView('list')}
              aria-label="List view"
            >
              <List size={14} aria-hidden="true" />
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} aria-hidden="true" />
              Post New Job
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="dash-filter-bar">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              className={`btn btn--sm ${activeFilter === f.value ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
              {counts[f.value] > 0 && (
                <span className="company-jobs-filter-count">{counts[f.value]}</span>
              )}
            </button>
          ))}
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => refetch()}
            style={{ marginLeft: 'auto' }}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {isLoading && <CompanyJobsCardsSkeleton view={view} count={view === 'grid' ? 4 : 5} />}

        {/* Error */}
        {isError && (
          <div className="dash-card">
            <div className="dash-card__body">
              Failed to load jobs.{' '}
              <button className="auth__inline-link" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filteredJobs.length === 0 && (
          <div className="dash-card">
            <div
              className="dash-card__body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              <Briefcase
                style={{
                  width: 40,
                  height: 40,
                  color: 'var(--color-muted,#9ca3af)',
                }}
              />
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {activeFilter === 'all'
                    ? 'No jobs yet'
                    : `No ${getJobStatusLabel(activeFilter)} jobs`}
                </p>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-muted,#9ca3af)',
                  }}
                >
                  {activeFilter === 'all'
                    ? 'Post your first job to start attracting candidates.'
                    : `You have no ${getJobStatusLabel(activeFilter).toLowerCase()} job postings.`}
                </p>
              </div>
              {activeFilter === 'all' && (
                <button className="btn btn--primary btn--sm" onClick={() => setShowCreate(true)}>
                  Post New Job
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && !isError && filteredJobs.length > 0 && (
          <div className={`company-jobs-cards company-jobs-cards--${view}`}>
            {filteredJobs.map((job) => (
              <RecruiterJobCard
                key={job.id}
                job={job}
                view={view}
                onEdit={() => setEditingJobId(job.id)}
                onDelete={() => setDeletingJob(job)}
                onStatusChange={(status) => handleStatusChange(job, status)}
                isUpdatingStatus={updatingStatusId === job.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <JobFormModal
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          isLoading={isCreating}
          submitLabel="Post Job"
        />
      )}

      {/* Edit modal */}
      {editingJobId && <EditJobModal jobId={editingJobId} onClose={() => setEditingJobId(null)} />}

      {/* Delete confirm */}
      {deletingJob && (
        <DeleteConfirmModal
          jobTitle={deletingJob.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingJob(null)}
          isLoading={isDeleting}
        />
      )}
    </>
  )
}
