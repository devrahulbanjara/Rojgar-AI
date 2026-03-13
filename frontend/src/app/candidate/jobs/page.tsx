'use client'

import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import Link from 'next/link'

import { useApplyToJobMutation } from '@/store/services/applicationsApi'
import {
  type JobListItem,
  type LocationType,
  type SearchJobsParams,
  useSearchJobsQuery,
} from '@/store/services/jobsApi'
import { useGetMyResumesQuery } from '@/store/services/resumeApi'
import { Bookmark, Briefcase, ChevronDown, Clock, MapPin, Search, X } from 'lucide-react'

import Loader from '@/components/common/Loader'

import { JobCardsSkeleton, JobPreviewSkeleton } from './_components/JobsSkeletons'

const LazyJobPreviewPanel = lazy(() => import('./_components/JobPreviewPanel'))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

// ---------------------------------------------------------------------------
// Category and salary band constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  full_stack: 'Full Stack',
  mobile: 'Mobile',
  data: 'Data',
  ml_ai: 'ML / AI',
  devops: 'DevOps',
  design: 'Design',
  product: 'Product',
  management: 'Management',
  security: 'Security',
  qa: 'QA',
  other: 'Other',
}

function formatSalary(min?: number | null, max?: number | null, currency = 'NPR'): string | null {
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
// Apply modal — shows resume picker then submits application
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '1.5rem 0',
              }}
            >
              <Loader size="sm" />
            </div>
          ) : resumes.length === 0 ? (
            <p style={{ color: 'var(--color-muted,#6b7280)' }}>
              You need to{' '}
              <Link href="/candidate/resume" className="auth__inline-link">
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
                      border: `1.5px solid ${selectedResumeId === r.id ? 'var(--color-primary,#7c3aed)' : 'var(--color-gray-200,#e5e7eb)'}`,
                      cursor: 'pointer',
                      background:
                        selectedResumeId === r.id ? 'var(--color-primary-50,#ede9fe)' : '',
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
// Main page
// ---------------------------------------------------------------------------

export default function UserJobsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [locationTypeDraft, setLocationTypeDraft] = useState<LocationType | null>(null)
  const [salaryMinInput, setSalaryMinInput] = useState('')
  const [salaryMaxInput, setSalaryMaxInput] = useState('')
  const [workTypeOpen, setWorkTypeOpen] = useState(false)
  const [applyingToJob, setApplyingToJob] = useState<JobListItem | null>(null)
  const [appliedParams, setAppliedParams] = useState<SearchJobsParams>({})

  const workTypeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (workTypeRef.current && !workTypeRef.current.contains(e.target as Node))
        setWorkTypeOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: jobsResp, isLoading, isError } = useSearchJobsQuery(appliedParams)
  const { items: jobs = [], pagination } = jobsResp?.data ?? {}

  const resolvedId = selectedJobId ?? jobs[0]?.id ?? null

  function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setAppliedParams({
      q: searchInput || undefined,
      location: locationInput || undefined,
      location_type: locationTypeDraft ?? undefined,
      salary_min: salaryMinInput ? Number(salaryMinInput) : undefined,
      salary_max: salaryMaxInput ? Number(salaryMaxInput) : undefined,
    })
    setSelectedJobId(null)
  }

  function handleClearSearch() {
    setSearchInput('')
    setAppliedParams((prev) => {
      return { ...prev, q: undefined }
    })
    setSelectedJobId(null)
  }

  return (
    <>
      <div className="dash-content container">
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Find Jobs</h2>
            <p className="dash-page-header__subtitle">
              Discover active roles, refine the search, and preview details before you apply.
            </p>
          </div>
          <div className="dash-page-header__actions">
            <span className="page-header-hint">
              {isLoading
                ? 'Loading jobs...'
                : `${pagination?.total ?? 0} job${pagination?.total === 1 ? '' : 's'} available`}
            </span>
          </div>
        </div>

        <div className="jobs-layout">
          {/* ── Filter Sidebar ── */}
          <div className="jobs-layout__sidebar">
            <div className="jobs-layout__sidebar-title">Filters</div>

            {/* Work Type dropdown */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Work Type</div>
              <div className="jobs-filter-dropdown" ref={workTypeRef}>
                <button
                  type="button"
                  className={`jobs-filter-dropdown__trigger${workTypeOpen ? ' jobs-filter-dropdown__trigger--open' : ''}${locationTypeDraft !== null ? ' jobs-filter-dropdown__trigger--active' : ''}`}
                  onClick={() => setWorkTypeOpen((v) => !v)}
                >
                  <span>
                    {locationTypeDraft ? LOCATION_TYPE_LABELS[locationTypeDraft] : 'All Types'}
                  </span>
                  <ChevronDown
                    className={`jobs-filter-dropdown__chevron${workTypeOpen ? ' jobs-filter-dropdown__chevron--open' : ''}`}
                    size={12}
                  />
                </button>
                {workTypeOpen && (
                  <div className="jobs-filter-dropdown__menu">
                    {([null, 'onsite', 'remote', 'hybrid'] as (LocationType | null)[]).map((t) => (
                      <button
                        key={String(t)}
                        type="button"
                        className={`jobs-filter-dropdown__option${locationTypeDraft === t ? ' jobs-filter-dropdown__option--active' : ''}`}
                        onClick={() => {
                          setLocationTypeDraft(t)
                          setWorkTypeOpen(false)
                        }}
                      >
                        <span className="jobs-filter-dropdown__option-dot" />
                        {t === null ? 'All Types' : LOCATION_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location text filter */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Location</div>
              <div className="jobs-sidebar-search">
                <span className="jobs-sidebar-search__icon">
                  <MapPin size={15} aria-hidden="true" />
                </span>
                <input
                  className="jobs-sidebar-search__input"
                  placeholder="e.g. Kathmandu…"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                />
                {locationInput && (
                  <button
                    type="button"
                    className="jobs-sidebar-search__btn"
                    aria-label="Clear location"
                    onClick={() => setLocationInput('')}
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>


            {/* Salary range inputs */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Salary (NPR)</div>
              <div className="jobs-salary-range">
                <input
                  type="number"
                  className="jobs-salary-range__input"
                  placeholder="Min"
                  value={salaryMinInput}
                  onChange={(e) => setSalaryMinInput(e.target.value)}
                />
                <span className="jobs-salary-range__sep">···</span>
                <input
                  type="number"
                  className="jobs-salary-range__input"
                  placeholder="Max"
                  value={salaryMaxInput}
                  onChange={(e) => setSalaryMaxInput(e.target.value)}
                />
              </div>
            </div>

            {/* Results count */}
            <div className="jobs-layout__filter-group jobs-layout__filter-group--last">
              <div className="jobs-sidebar-results-count">
                {isLoading
                  ? 'Searching…'
                  : `${pagination?.total ?? 0} result${pagination?.total !== 1 ? 's' : ''} found`}
              </div>
            </div>
          </div>

          {/* ── Job List ── */}
          <div>
            <form className="dash-page-toolbar" onSubmit={handleSearch}>
              <div className="dash-page-toolbar__search">
                <span className="dash-page-toolbar__icon">
                  <Search size={16} aria-hidden="true" />
                </span>
                <input
                  className="dash-page-toolbar__input"
                  placeholder="Search jobs by title"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="dash-page-toolbar__clear"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <button type="submit" className="dash-page-toolbar__submit">
                Search
              </button>
            </form>

            {isLoading ? (
              <JobCardsSkeleton count={5} />
            ) : isError ? (
              <div className="dash-card">
                <div className="dash-card__body">Failed to load jobs.</div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="dash-card">
                <div className="dash-card__body dash-empty-state">
                  <Briefcase className="dash-empty-state__icon" />
                  <p>No jobs match your search.</p>
                </div>
              </div>
            ) : (
              <div className="job-list-stack content-stagger">
                {jobs.map((job, index) => {
                  const showFallbackDivider = job.is_fallback && (index === 0 || !jobs[index - 1].is_fallback);
                  
                  return (
                    <div key={job.id} style={{ display: 'contents' }}>
                      {showFallbackDivider && (
                        <div className="job-list-fallback-divider">
                          <span className="job-list-fallback-divider__line" />
                          <span className="job-list-fallback-divider__text">
                            Recommended jobs outside your filters
                          </span>
                          <span className="job-list-fallback-divider__line" />
                        </div>
                      )}
                      <div
                        className={`job-card content-stagger-item${resolvedId === job.id ? ' job-card--active' : ''}`}
                        style={{ '--stagger-index': index } as React.CSSProperties}
                        onClick={() => setSelectedJobId(job.id)}
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
                              {job.location ? (
                                <MapPin size={11} aria-hidden="true" />
                              ) : (
                                <Briefcase size={11} aria-hidden="true" />
                              )}
                              <span>
                                {job.location ? `${job.location} · ` : ''}
                                {LOCATION_TYPE_LABELS[job.location_type]}
                              </span>
                            </div>
                          </div>
                          <div className="job-card__actions-wrap">
                            {job.match_score !== null && (
                              <div className="job-match-badge" title="AI Match Score">
                                {Math.round(job.match_score * 100)}% Match
                              </div>
                            )}
                            <button
                              className="job-card__bookmark"
                              title="Save job"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Bookmark size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="job-card__tags">
                          <span className="job-card__tag">
                            {LOCATION_TYPE_LABELS[job.location_type]}
                          </span>
                          {job.category && (
                            <span className="job-card__tag">
                              {CATEGORY_LABELS[job.category] ?? job.category}
                            </span>
                          )}
                          {(job.salary_min || job.salary_max) && (
                            <span className="job-card__tag job-card__tag--salary">
                              {formatSalary(job.salary_min, job.salary_max, job.currency)}
                            </span>
                          )}
                        </div>

                        <div className="job-card__meta">
                          <span className="job-card__meta-time">
                            <Clock size={12} aria-hidden="true" />
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {pagination && pagination.pages > 1 && (
                  <div className="jobs-pagination">
                    <button 
                      className="btn btn--ghost btn--sm"
                      disabled={!pagination.has_prev}
                      onClick={() => setAppliedParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    >
                      Previous
                    </button>
                    <span className="jobs-pagination__info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button 
                      className="btn btn--ghost btn--sm"
                      disabled={!pagination.has_next}
                      onClick={() => setAppliedParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Job Preview Panel ── */}
          {isLoading ? (
            <JobPreviewSkeleton />
          ) : resolvedId ? (
            <Suspense fallback={<JobPreviewSkeleton />}>
              <LazyJobPreviewPanel
                jobId={resolvedId}
                allJobs={jobs}
                onApply={() => {
                  const j = jobs.find((x) => x.id === resolvedId)
                  if (j) setApplyingToJob(j)
                }}
              />
            </Suspense>
          ) : (
            <div className="job-preview content-fade-in">
              <div className="job-preview__empty">
                <Briefcase style={{ width: 40, height: 40, opacity: 0.3 }} />
                <p>Select a job to preview details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyingToJob && (
        <ApplyModal
          jobId={applyingToJob.id}
          jobTitle={applyingToJob.title}
          onClose={() => setApplyingToJob(null)}
        />
      )}
    </>
  )
}
