'use client'

import { Suspense, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useReveal } from '@/hooks/useReveal'
import { type SearchJobsParams, useSearchJobsQuery } from '@/store/services/jobsApi'
import { Briefcase } from 'lucide-react'

import { SearchInput, Toolbar, ToolbarCount } from '@/components/common/Toolbar'
import PublicJobCard from '@/components/jobs/PublicJobCard'

// ---------------------------------------------------------------------------
// Inner component (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function JobsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const qParam = searchParams.get('q') ?? ''
  const locationParam = searchParams.get('location') ?? ''
  const pageParam = Number(searchParams.get('page')) || 1

  const params: SearchJobsParams = {
    ...(qParam && { q: qParam }),
    ...(locationParam && { location: locationParam }),
    page: pageParam,
    size: 12,
  }

  const { data, isLoading, isError } = useSearchJobsQuery(params)
  const jobs = data?.data?.items ?? []
  const pagination = data?.data?.pagination

  const [searchTerm, setSearchTerm] = useState(qParam)

  useReveal()

  function handleSearch() {
    const sp = new URLSearchParams(searchParams.toString())
    if (searchTerm.trim()) sp.set('q', searchTerm.trim())
    else sp.delete('q')
    sp.delete('page')
    router.push(`/jobs?${sp.toString()}`)
  }

  function handlePageChange(page: number) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set('page', String(page))
    router.push(`/jobs?${sp.toString()}`)
  }

  return (
    <div className="public-jobs">
      <div className="container">
        {/* Header */}
        <div className="public-jobs__header" data-reveal>
          <h1 className="public-jobs__title">Browse Jobs</h1>
          <p className="public-jobs__subtitle">
            {isLoading
              ? 'Loading jobs...'
              : `${pagination?.total ?? 0} active job${(pagination?.total ?? 0) === 1 ? '' : 's'} available`}
          </p>
        </div>

        {/* Search toolbar */}
        <Toolbar>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            onEnter={handleSearch}
            placeholder="Job title or keyword"
          />
          <button className="btn btn--primary btn--sm" onClick={handleSearch}>
            Search
          </button>
          <ToolbarCount>
            {pagination?.total ?? 0} job{(pagination?.total ?? 0) === 1 ? '' : 's'}
          </ToolbarCount>
        </Toolbar>

        {/* Job grid */}
        {isLoading ? (
          <div className="public-jobs__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="public-jobs__skeleton" />
            ))}
          </div>
        ) : isError ? (
          <div className="public-jobs__empty">
            <p>Failed to load jobs. Please try again later.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="public-jobs__empty">
            <Briefcase style={{ width: 40, height: 40, opacity: 0.3 }} />
            <p>No jobs match your search. Try different keywords.</p>
          </div>
        ) : (
          <>
            <div className="public-jobs__grid">
              {jobs.map((job, i) => (
                <div
                  key={job.id}
                  className="public-jobs__card-enter"
                  style={{ '--stagger': `${i * 0.05}s` } as React.CSSProperties}
                >
                  <PublicJobCard job={job} />
                </div>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="public-jobs__pagination">
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={!pagination.has_prev}
                  onClick={() => handlePageChange(pageParam - 1)}
                >
                  Previous
                </button>
                <span className="public-jobs__page-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={!pagination.has_next}
                  onClick={() => handlePageChange(pageParam + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page export — wraps inner in Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------

export default function JobsPage() {
  return (
    <Suspense>
      <JobsPageInner />
    </Suspense>
  )
}
