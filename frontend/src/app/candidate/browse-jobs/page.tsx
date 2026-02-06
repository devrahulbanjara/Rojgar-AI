'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  usePersonalizedRecommendations,
  useCreateApplication,
  useJobSearch,
} from '../../../hooks/queries/useJobs'
import { useAuth } from '../../../hooks/useAuth'
import { JobCard, JobSearchBar, FilterChips, type FilterType } from '../../../components/jobs'
import { JobDetailsModal } from '../../../components/jobs/JobDetailsModal'
import { AppShell } from '../../../components/layout/AppShell'
import { Button } from '../../../components/ui/button'
import {
  AnimatedContainer,
  LoadingSpinner,
  SkeletonJobCard,
} from '../../../components/common'
import { RefreshCw, AlertCircle, Search, Filter } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Job } from '../../../types/job'

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([])

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()

  const isSearchMode = debouncedSearchQuery.trim().length > 0

  const backendFilters = useMemo(() => {
    const filters: { employmentType?: string; locationType?: string } = {}

    activeFilters.forEach(filter => {
      switch (filter) {
        case 'remote':
          filters.locationType = 'Remote'
          break
        case 'hybrid':
          filters.locationType = 'Hybrid'
          break
        case 'full-time':
          filters.employmentType = 'Full-time'
          break
        case 'part-time':
          filters.employmentType = 'Part-time'
          break
        case 'contract':
          filters.employmentType = 'Contract'
          break
      }
    })

    return filters
  }, [activeFilters])

  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = usePersonalizedRecommendations(user?.id || '', currentPage, 9, backendFilters)

  const shouldFetchSearch = isSearchMode && debouncedSearchQuery.trim().length > 0
  const {
    data: searchData,
    isLoading: isLoadingSearch,
    error: searchError,
    refetch: refetchSearch,
  } = useJobSearch(
    shouldFetchSearch
      ? {
          search: debouncedSearchQuery.trim(),
          page: currentPage,
          limit: 9,
          ...backendFilters,
          userId: user?.id,
        }
      : undefined
  )

  const jobsData = isSearchMode ? searchData : recommendationsData
  const isLoading = isSearchMode
    ? shouldFetchSearch
      ? isLoadingSearch
      : false
    : isAuthLoading || isLoadingRecommendations || isRefreshing
  const error = isSearchMode ? searchError : recommendationsError
  useEffect(() => {
    console.warn('Auth status effect:', {
      userId: user?.id,
      isAuthLoading,
      isAuthenticated,
      hasRecommendations: !!recommendationsData,
      isLoadingRecommendations,
    })

    // Force immediate fetch when user is authenticated and has ID - this is the key fix
    if (
      user?.id &&
      !isSearchMode &&
      isAuthenticated &&
      !isAuthLoading &&
      !isLoadingRecommendations &&
      !recommendationsData
    ) {
      console.warn('Triggering immediate recommendations fetch...')
      refetchRecommendations()
    }
  }, [
    user?.id,
    isSearchMode,
    isAuthenticated,
    isAuthLoading,
    isLoadingRecommendations,
    recommendationsData,
    refetchRecommendations,
  ])

  const createApplicationMutation = useCreateApplication()

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      if (isSearchMode) {
        await queryClient.invalidateQueries({
          queryKey: ['jobs', 'search'],
          refetchType: 'active',
        })
        await refetchSearch()
      } else {
        await queryClient.invalidateQueries({
          queryKey: ['jobs', 'personalized'],
          refetchType: 'active',
        })

        if (typeof window !== 'undefined') {
          try {
            const cacheKey = 'convexhire-query-cache'
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
              const cacheData = JSON.parse(cached) as Record<string, unknown>
              const newCache: Record<string, unknown> = {}
              Object.entries(cacheData).forEach(([key, value]) => {
                try {
                  const queryKey = JSON.parse(key)
                  if (!Array.isArray(queryKey) || queryKey[0] !== 'jobs') {
                    newCache[key] = value
                  }
                } catch {
                  if (!key.includes('jobs')) {
                    newCache[key] = value
                  }
                }
              })
              localStorage.setItem(cacheKey, JSON.stringify(newCache))
            }
          } catch (e) {
            console.warn('Failed to clear localStorage cache:', e)
          }
        }

        await refetchRecommendations()
      }

      toast.success(isSearchMode ? 'Search results refreshed' : 'Job recommendations refreshed')
    } catch (error) {
      console.error('Failed to refresh:', error)
      toast.error('Failed to refresh')
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, isSearchMode, refetchSearch, refetchRecommendations])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const handleFilterToggle = useCallback((filter: FilterType) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter)
      }
      return [...prev, filter]
    })
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setActiveFilters([])
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleJobSelect = useCallback((job: Job) => {
    setSelectedJob(job)
    setIsDetailModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsDetailModalOpen(false)
    setTimeout(() => setSelectedJob(null), 300)
  }, [])

  const handleJobApply = useCallback(
    async (job: Job) => {
      try {
        await createApplicationMutation.mutateAsync({
          job_id: job.id.toString(),
        })
      } catch {
        // Error handled by mutation
      }
    },
    [createApplicationMutation]
  )

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isAuthLoading])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        if (isSearchMode) {
          queryClient.invalidateQueries({
            queryKey: ['jobs', 'search'],
            refetchType: 'active',
          })
          refetchSearch()
        } else {
          refetchRecommendations()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchMode, refetchRecommendations, refetchSearch, queryClient])

  const jobs = jobsData?.jobs || []
  const totalJobs = jobsData?.total || 0
  const totalPages = jobsData?.total_pages || 0

  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Enhanced Header with Gradient */}
        <AnimatedContainer direction="up" delay={0.1}>
          <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-300 ease-out">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {isSearchMode ? 'Search Results' : 'Find Your Next Role'}
                  </h1>
                  <p className="text-lg text-slate-600 max-w-2xl">
                    {isSearchMode
                      ? debouncedSearchQuery
                        ? `Found ${totalJobs} matches for "${debouncedSearchQuery}"`
                        : 'Search results based on your criteria'
                      : 'Discover opportunities matched to your skills and experience'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-200 shadow-sm transition-all duration-200"
                >
                  <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                  Refresh Jobs
                </Button>
              </div>

              {/* Enhanced Search & Filter Section */}
              <div className="space-y-6 bg-white rounded-2xl p-6 border border-slate-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <JobSearchBar
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onDebouncedChange={handleDebouncedSearchChange}
                  loading={isLoadingSearch}
                  placeholder="Search by job title, company, or skills..."
                />

                {/* Filter Chips with more breathing room */}
                <FilterChips
                  activeFilters={activeFilters}
                  onFilterToggle={handleFilterToggle}
                  onClearAll={handleClearFilters}
                  showAvailable
                />
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Main Content - Job Cards Grid */}
        <AnimatedContainer direction="up" delay={0.3}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isLoading
                      ? 'Loading...'
                      : isSearchMode
                        ? 'Search Results'
                        : 'Recommended For You'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} available
                  </p>
                </div>
              </div>
            </div>

            {/* Job Cards Grid with larger gap */}
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                <>
                  {Array.from({ length: 9 }).map((_, index) => (
                    <SkeletonJobCard
                      key={index}
                      className="h-full hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                    />
                  ))}
                </>
              ) : error ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-6 bg-red-50/30 rounded-3xl border border-red-100">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-red-100">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="text-center max-w-md px-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Unable to load jobs</h3>
                    <p className="text-slate-600 mb-6">
                      {error.message ||
                        'Something went wrong while fetching jobs. Please try again.'}
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-red-600 hover:bg-red-700 text-white px-8"
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 space-y-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-white shadow-sm border border-indigo-100">
                    <Search className="w-12 h-12 text-indigo-500" />
                  </div>
                  <div className="text-center max-w-md px-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs found</h3>
                    <p className="text-slate-600 mb-6">
                      We couldn&apos;t find any jobs matching your criteria. Try adjusting your
                      filters or search terms.
                    </p>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                      >
                        <Filter className="w-4 h-4" />
                        Clear all filters
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSelected={selectedJob?.id === job.id}
                      onSelect={handleJobSelect}
                      onApply={handleJobApply}
                      showApplyButton={false}
                      className="h-full hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                    />
                  ))}
                </>
              )}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && totalJobs > 0 && (
              <div className="mt-16 flex justify-center">
                <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            'h-10 w-10 rounded-xl text-sm font-semibold transition-all duration-200',
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                          )}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-10 w-10 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </AnimatedContainer>

        {/* Job Details Modal */}
        <JobDetailsModal
          job={selectedJob}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onApply={handleJobApply}
          showApplyButton
        />
      </div>
    </AppShell>
  )
}
