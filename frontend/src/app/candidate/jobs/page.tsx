'use client'

import { Suspense, lazy, useEffect, useRef, useState } from 'react'

import { LOCATION_TYPE_LABELS, formatDate, formatSalary, getCompanyAccent } from '@/lib/jobHelpers'
import {
  type JobListItem,
  type LocationType,
  type SearchJobsParams,
  useSearchJobsQuery,
} from '@/store/services/jobsApi'
import { Bookmark, Briefcase, Calendar, ChevronDown, Clock, MapPin, Search, X } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import ApplyFlowModal from '@/components/jobs/ApplyModal'

import { JobCardsSkeleton, JobPreviewSkeleton } from './_components/JobsSkeletons'

const LazyJobPreviewPanel = lazy(() => import('./_components/JobPreviewPanel'))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatExpiryDate(iso: string | null): { text: string; color: string } | null {
  if (!iso) return null

  const expiryDate = new Date(iso)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 86400000)

  if (daysUntilExpiry < 0) {
    return { text: 'Expired', color: '#ff4d4d' }
  }

  if (daysUntilExpiry === 0) {
    return { text: 'Expires today', color: '#f59e0b' }
  }

  if (daysUntilExpiry === 1) {
    return { text: 'Expires tomorrow', color: '#f59e0b' }
  }

  if (daysUntilExpiry <= 7) {
    return { text: `Expires in ${daysUntilExpiry} days`, color: '#f59e0b' }
  }

  return {
    text: `Expires ${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    color: '#6b7280',
  }
}

// ---------------------------------------------------------------------------
// Apply modal — shows resume picker then submits application
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

  const { data: jobsResp, isLoading, isError, refetch } = useSearchJobsQuery(appliedParams)
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
      <div className="dash-content container container--app-shell">
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

        <form className="jobs-layout" onSubmit={handleSearch}>
          {/* ── Filter Sidebar ── */}
          <div className="jobs-layout__sidebar">
            <div className="jobs-layout__sidebar-title">Filters</div>

            {/* Work Type dropdown */}
            <div className="jobs-layout__filter-group">
              <div className="jobs-layout__filter-group-label">Work Type</div>
              <div className="jobs-filter-dropdown" ref={workTypeRef}>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm btn--full"
                  aria-pressed={locationTypeDraft !== null}
                  aria-expanded={workTypeOpen}
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
                        className="btn btn--ghost btn--menu"
                        aria-pressed={locationTypeDraft === t}
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
                  type="text"
                  className="jobs-sidebar-search__input"
                  placeholder="e.g. Kathmandu…"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
                {locationInput && (
                  <button
                    type="button"
                    className="btn btn--icon btn--sm"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
                <span className="jobs-salary-range__sep">···</span>
                <input
                  type="number"
                  className="jobs-salary-range__input"
                  placeholder="Max"
                  value={salaryMaxInput}
                  onChange={(e) => setSalaryMaxInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Job List ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dash-page-toolbar">
              <div className="dash-page-toolbar__search">
                <span className="dash-page-toolbar__icon">
                  <Search size={16} aria-hidden="true" />
                </span>
                <input
                  type="text"
                  className="dash-page-toolbar__input"
                  placeholder="Search jobs by title"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="btn btn--icon btn--sm dash-page-toolbar__clear"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn--primary">
                Search
              </button>
            </div>

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
                  const showFallbackDivider =
                    job.is_fallback && (index === 0 || !jobs[index - 1].is_fallback)
                  const accent = getCompanyAccent(job.company?.name ?? job.title)

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
                          <Avatar
                            name={job.company?.name ?? job.title}
                            src={job.company?.logo_url}
                            seed={job.company?.id ?? job.company?.name ?? job.title}
                            kind="company"
                            className="job-card__logo"
                            sizes="48px"
                            style={
                              {
                                '--logo-bg': accent.color + '1A',
                                '--logo-color': accent.color,
                              } as React.CSSProperties
                            }
                          />
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
                              <span className="match-score" title="AI Match Score">
                                {Math.round(job.match_score * 100)}% Match
                              </span>
                            )}
                            <button
                              className="btn btn--icon btn--sm"
                              title="Save job"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Bookmark size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="job-meta">
                          <span className="job-meta__item">
                            {LOCATION_TYPE_LABELS[job.location_type]}
                          </span>
                          {(job.salary_min || job.salary_max) && (
                            <>
                              <span className="job-meta__sep" aria-hidden="true">
                                ·
                              </span>
                              <span className="job-meta__item job-meta__item--salary">
                                {formatSalary(job.salary_min, job.salary_max, job.currency)}
                              </span>
                            </>
                          )}
                          <span className="job-meta__sep" aria-hidden="true">
                            ·
                          </span>
                          <span className="job-meta__item job-meta__item--time">
                            <Clock size={11} aria-hidden="true" />
                            {formatDate(job.created_at)}
                          </span>
                          {job.expires_at &&
                            (() => {
                              const expiry = formatExpiryDate(job.expires_at)
                              if (!expiry) return null
                              const mod =
                                expiry.color === '#ff4d4d'
                                  ? 'expiry-danger'
                                  : expiry.color === '#f59e0b'
                                    ? 'expiry-warning'
                                    : 'time'
                              return (
                                <>
                                  <span className="job-meta__sep" aria-hidden="true">
                                    ·
                                  </span>
                                  <span className={`job-meta__item job-meta__item--${mod}`}>
                                    <Calendar size={11} aria-hidden="true" />
                                    {expiry.text}
                                  </span>
                                </>
                              )
                            })()}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {pagination && pagination.pages > 1 && (
                  <div className="jobs-pagination">
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={!pagination.has_prev}
                      onClick={() =>
                        setAppliedParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                      }
                    >
                      Previous
                    </button>
                    <span className="jobs-pagination__info">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={!pagination.has_next}
                      onClick={() =>
                        setAppliedParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                      }
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
                  if (j && !j.has_applied) setApplyingToJob(j)
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
        </form>
      </div>

      {/* Apply modal */}
      {applyingToJob && (
        <ApplyModal
          jobId={applyingToJob.id}
          jobTitle={applyingToJob.title}
          onClose={() => setApplyingToJob(null)}
          onSuccess={() => {
            void refetch()
          }}
        />
      )}
    </>
  )
}
