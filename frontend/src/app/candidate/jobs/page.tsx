'use client'

import { useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { getCompanyAccent } from '@/lib/companyAccent'
import { LOCATION_TYPE_LABELS, formatDate, formatSalary } from '@/lib/jobHelpers'
import { notify } from '@/lib/notify'
import { LIMITS, isSalaryRangeValid } from '@/lib/validation'
import {
  type JobListItem,
  type LocationType,
  type SearchJobsParams,
  useSearchJobsQuery,
} from '@/store/services/jobsApi'
import { Briefcase, Calendar, Clock, DollarSign, MapPin } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import { FilterSelect, SearchInput, Toolbar } from '@/components/common/Toolbar'
import ApplyFlowModal from '@/components/jobs/ApplyModal'

import styles from './page.module.scss'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatExpiryDate(iso: string | null): { text: string; mod: string } | null {
  if (!iso) return null

  const expiryDate = new Date(iso)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 86400000)

  if (daysUntilExpiry < 0) return { text: 'Expired', mod: 'danger' }
  if (daysUntilExpiry === 0) return { text: 'Expires today', mod: 'warning' }
  if (daysUntilExpiry === 1) return { text: 'Expires tomorrow', mod: 'warning' }
  if (daysUntilExpiry <= 7) return { text: `Expires in ${daysUntilExpiry} days`, mod: 'warning' }

  return {
    text: `Expires ${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    mod: 'muted',
  }
}

const WORK_TYPE_OPTIONS: Array<{ value: LocationType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function JobCard({ job, onApply }: { job: JobListItem; onApply: (job: JobListItem) => void }) {
  const accent = getCompanyAccent(job.company?.name ?? job.title)
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)
  const expiry = formatExpiryDate(job.expires_at)

  return (
    <Link
      href={`/candidate/jobs/${job.id}`}
      className={styles.card}
      style={{ textDecoration: 'none' }}
    >
      <div className={styles.cardHeader}>
        <Avatar
          name={job.company?.name ?? job.title}
          src={job.company?.logo_url}
          seed={job.company?.id ?? job.company?.name ?? job.title}
          kind="company"
          className={styles.logo}
          sizes="44px"
          style={
            {
              '--logo-bg': accent.background,
              '--logo-color': accent.color,
            } as React.CSSProperties
          }
        />
        <div className={styles.titleWrap}>
          <h3 className={styles.title}>{job.title}</h3>
          <div className={styles.company}>{job.company?.name}</div>
        </div>
      </div>

      <div className={styles.infoStack}>
        <div className={styles.row}>
          <MapPin size={13} aria-hidden="true" />
          <span>
            {job.location ? `${job.location} · ` : ''}
            {LOCATION_TYPE_LABELS[job.location_type]}
          </span>
        </div>

        <div className={styles.row}>
          <DollarSign size={13} aria-hidden="true" />
          <span className={salary ? styles.rowStrong : styles.rowMuted}>
            {salary ?? 'Salary not disclosed'}
          </span>
        </div>

        <div className={styles.row}>
          <Clock size={13} aria-hidden="true" />
          <span>Posted {formatDate(job.created_at)}</span>
        </div>

        <div
          className={`${styles.row} ${
            expiry?.mod === 'danger'
              ? styles.rowDanger
              : expiry?.mod === 'warning'
                ? styles.rowWarning
                : ''
          }`}
        >
          <Calendar size={13} aria-hidden="true" />
          <span>{expiry?.text ?? 'No expiry'}</span>
        </div>
      </div>

      <div className={styles.cardActions}>
        {job.has_applied ? (
          <span
            className="btn btn--ghost btn--sm btn--full"
            style={{ pointerEvents: 'none' }}
            aria-label="Already applied"
          >
            Applied
          </span>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--sm btn--full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onApply(job)
            }}
          >
            Apply
          </button>
        )}
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

// Filters live in the URL so "back" from a job, a refresh or a shared link
// keeps the search. This page renders client-only (behind AuthGuard).
function readUrlFilters() {
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
  const type = params.get('type')
  return {
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    type: (type && type in LOCATION_TYPE_LABELS ? type : 'all') as LocationType | 'all',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
  }
}

function toSearchParams(filters: ReturnType<typeof readUrlFilters>): SearchJobsParams {
  return {
    q: filters.q || undefined,
    location: filters.location || undefined,
    location_type: filters.type === 'all' ? undefined : filters.type,
    salary_min: filters.min ? Number(filters.min) : undefined,
    salary_max: filters.max ? Number(filters.max) : undefined,
  }
}

export default function UserJobsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [initialFilters] = useState(readUrlFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.q)
  const [locationInput, setLocationInput] = useState(initialFilters.location)
  const [locationTypeDraft, setLocationTypeDraft] = useState<LocationType | 'all'>(
    initialFilters.type,
  )
  const [salaryMinInput, setSalaryMinInput] = useState(initialFilters.min)
  const [salaryMaxInput, setSalaryMaxInput] = useState(initialFilters.max)
  const [applyingToJob, setApplyingToJob] = useState<JobListItem | null>(null)
  const [appliedParams, setAppliedParams] = useState<SearchJobsParams>(() =>
    toSearchParams(initialFilters),
  )

  const {
    data: jobsResp,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSearchJobsQuery(appliedParams)
  const { items: jobs = [], pagination } = jobsResp?.data ?? {}

  function handleSearch(overrides: { type?: LocationType | 'all' } = {}) {
    const type = overrides.type ?? locationTypeDraft
    if (salaryMinInput && Number(salaryMinInput) < 0) {
      notify.error('Minimum salary cannot be negative.')
      return
    }
    if (salaryMaxInput && Number(salaryMaxInput) < 0) {
      notify.error('Maximum salary cannot be negative.')
      return
    }
    if (!isSalaryRangeValid(salaryMinInput, salaryMaxInput)) {
      notify.error('Maximum salary must be greater than or equal to minimum.')
      return
    }
    const filters = {
      q: searchInput.trim(),
      location: locationInput.trim(),
      type,
      min: salaryMinInput,
      max: salaryMaxInput,
    }
    setAppliedParams(toSearchParams(filters))
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value && value !== 'all') as [string, string][],
    ).toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <>
      <div className={`dash-content container container--app-shell ${styles.page}`}>
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Find Jobs</h2>
          </div>
          <div className="dash-page-header__actions">
            <span className="page-header-hint">
              {isLoading || isFetching
                ? 'Loading jobs...'
                : `${pagination?.total ?? 0} job${pagination?.total === 1 ? '' : 's'} available`}
            </span>
          </div>
        </div>

        <Toolbar>
          <SearchInput
            value={searchInput}
            onChange={(next) => setSearchInput(next)}
            placeholder="Search jobs by title"
            onEnter={() => handleSearch()}
          />
          <div className={styles.filterGroup}>
            <FilterSelect<LocationType | 'all'>
              value={locationTypeDraft}
              onChange={(next) => {
                setLocationTypeDraft(next)
                handleSearch({ type: next })
              }}
              options={WORK_TYPE_OPTIONS}
              ariaLabel="Filter by work type"
            />
            <div className={styles.locationWrap}>
              <MapPin size={14} aria-hidden="true" />
              <input
                type="text"
                className={styles.filterInput}
                placeholder="Location…"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
            </div>
            <div className={styles.salaryWrap}>
              <input
                type="number"
                min={0}
                max={LIMITS.salaryMax}
                className={styles.salaryInput}
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
              <span className={styles.salarySep}>–</span>
              <input
                type="number"
                min={0}
                max={LIMITS.salaryMax}
                className={styles.salaryInput}
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
          <button
            type="button"
            className={`btn btn--primary ${isFetching ? 'btn--loading' : ''}`}
            onClick={() => handleSearch()}
            disabled={isFetching}
          >
            Search
          </button>
        </Toolbar>

        {isLoading ? (
          <div className={styles.skeleton}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : isError ? (
          <div className={styles.empty}>
            <Briefcase className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Failed to load jobs</p>
            <button className="btn btn--secondary btn--sm" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className={styles.empty}>
            <Briefcase className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>No jobs match your search</p>
            <p className={styles.emptyCopy}>Try broadening your filters or check back later.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {jobs.map((job, index) => {
                const showFallbackDivider =
                  job.is_fallback && (index === 0 || !jobs[index - 1].is_fallback)

                return showFallbackDivider ? (
                  <div key={job.id} style={{ display: 'contents' }}>
                    <div className={styles.fallbackDivider}>
                      Recommended jobs outside your filters
                    </div>
                    <JobCard job={job} onApply={setApplyingToJob} />
                  </div>
                ) : (
                  <JobCard key={job.id} job={job} onApply={setApplyingToJob} />
                )
              })}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={!pagination.has_prev}
                  onClick={() =>
                    setAppliedParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                  }
                >
                  Previous
                </button>
                <span className={styles.paginationInfo}>
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
          </>
        )}
      </div>

      {applyingToJob && (
        <ApplyFlowModal
          isOpen={true}
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
