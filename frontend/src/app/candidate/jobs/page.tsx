'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  usePersonalizedRecommendations,
  useCreateApplication,
  useJobSearch,
  useApplicationsByCandidate,
} from '../../../hooks/queries/useJobs'
import { useAuth } from '../../../hooks/useAuth'
import { JobCard, FilterChips, type FilterType } from '../../../components/jobs'
import { JobDetailsModal } from '../../../components/jobs/JobDetailsModal'
import { AppShell } from '../../../components/layout/AppShell'
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger } from '../../../components/ui'
import { AnimatedContainer, SkeletonJobCard, SkeletonLoader } from '../../../components/common'
import { RefreshCw, AlertCircle, Search, Briefcase, Bookmark, Clock } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Job } from '../../../types/job'
import type { Application } from '../../../types/application'

function CandidateJobsPageSkeleton() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 w-full md:max-w-xl">
              <SkeletonLoader variant="text" height={38} width="55%" />
              <SkeletonLoader variant="text" height={18} width="90%" />
            </div>
            <SkeletonLoader variant="rectangular" width={132} height={44} className="rounded-xl" />
          </div>

          <Card className="p-4 shadow-sm border-border-default bg-background-surface">
            <div className="flex flex-col lg:flex-row gap-4">
              <SkeletonLoader variant="rectangular" height={44} className="rounded-lg flex-1" />
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonLoader
                    key={index}
                    variant="rectangular"
                    width={92}
                    height={34}
                    className="rounded-full"
                  />
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-8">
            <Tabs value="recommended" className="w-full">
              <TabsList className="bg-transparent border-b border-border-subtle rounded-none w-full justify-start h-auto p-0 gap-8">
                {Array.from({ length: 3 }).map((_, index) => (
                  <TabsTrigger
                    key={index}
                    value={`skeleton-tab-${index}`}
                    className="rounded-none px-0 pb-3 pointer-events-none"
                  >
                    <SkeletonLoader variant="rectangular" width={90} height={14} className="rounded-sm" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonJobCard key={index} className="h-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([])
  const [activeTab, setActiveTab] = useState<'recommended' | 'applied' | 'saved'>('recommended')

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
      }
      : undefined
  )

  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    error: applicationsError,
  } = useApplicationsByCandidate(user?.id || '', {
    page: currentPage,
    limit: 9,
  })

  // Unified Data Handling
  const jobsData = isSearchMode ? searchData : activeTab === 'recommended' ? recommendationsData : undefined
  const applications = Array.isArray(applicationsData) ? applicationsData : []

  const isLoading = isSearchMode
    ? shouldFetchSearch && isLoadingSearch
    : activeTab === 'recommended'
      ? isAuthLoading || isLoadingRecommendations || isRefreshing
      : activeTab === 'applied'
        ? isLoadingApplications
        : false

  const error = isSearchMode
    ? searchError
    : activeTab === 'recommended'
      ? recommendationsError
      : activeTab === 'applied'
        ? applicationsError
        : null

  const jobs = jobsData?.jobs || []
  const totalJobs = jobsData?.total || 0
  const totalPages = jobsData?.total_pages || 0

  useEffect(() => {
    if (
      user?.id &&
      !isSearchMode &&
      isAuthenticated &&
      !isAuthLoading &&
      !isLoadingRecommendations &&
      !recommendationsData &&
      activeTab === 'recommended'
    ) {
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
    activeTab,
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
      } else if (activeTab === 'recommended') {
        await queryClient.invalidateQueries({
          queryKey: ['jobs', 'personalized'],
          refetchType: 'active',
        })
        await refetchRecommendations()
      }

      toast.success(isSearchMode ? 'Search results refreshed' : 'Job list refreshed')
    } catch (error) {
      console.error('Failed to refresh:', error)
      toast.error('Failed to refresh')
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, isSearchMode, refetchSearch, refetchRecommendations, activeTab])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
          resume_id: 'default',
        })
      } catch {
        // Ignore application errors
      }
    },
    [createApplicationMutation]
  )

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'recommended' | 'applied' | 'saved')
    setCurrentPage(1)
  }

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/signin'
    }
  }, [isAuthenticated, isAuthLoading])

  if (isAuthLoading) {
    return <CandidateJobsPageSkeleton />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-10">
        {/* Header */}
        <AnimatedContainer direction="up" delay={0.1}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2.5">
              <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
                {isSearchMode ? 'Search Results' : 'Find Your Next Role'}
              </h1>
              <p className="text-text-secondary text-lg">
                {isSearchMode
                  ? debouncedSearchQuery
                    ? `Found ${totalJobs} matches for "${debouncedSearchQuery}"`
                    : 'Search results based on your criteria'
                  : 'Discover opportunities matched to your skills and experience'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="h-11 px-5 text-primary-600 border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-950/30 shadow-sm transition-all whitespace-nowrap"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
              Refresh Jobs
            </Button>
          </div>
        </AnimatedContainer>

        {/* Search & Filter */}
        <AnimatedContainer direction="up" delay={0.15}>
          <Card className="p-4 shadow-sm border-border-default bg-background-surface">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4.5 h-4.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search by job title, company, or skills..."
                  className="w-full pl-11 pr-4 py-2.5 bg-background-subtle border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-text-muted text-sm font-medium text-text-primary"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                <FilterChips
                  activeFilters={activeFilters}
                  onFilterToggle={handleFilterToggle}
                  onClearAll={handleClearFilters}
                  showAvailable
                />
              </div>
            </div>
          </Card>
        </AnimatedContainer>

        {/* Tabs & Grid */}
        <AnimatedContainer direction="up" delay={0.3}>
          <div className="w-full space-y-8">
            <Tabs value={isSearchMode ? 'recommended' : activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="bg-transparent border-b border-border-subtle rounded-none w-full justify-start h-auto p-0 gap-8">
                <TabsTrigger
                  value="recommended"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-3 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                >
                  {isSearchMode ? 'Search Results' : 'Recommended'}
                  {recommendationsData?.total !== undefined && !isSearchMode && (
                    <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                      {recommendationsData.total}
                    </span>
                  )}
                  {isSearchMode && totalJobs !== undefined && (
                    <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                      {totalJobs}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="applied"
                  disabled={isSearchMode}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-3 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                >
                  Applied
                  <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">
                    {applications.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  disabled={isSearchMode}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:bg-transparent px-0 pb-3 text-text-tertiary data-[state=active]:text-text-primary font-bold text-sm transition-all shadow-none"
                >
                  Saved
                  <span className="ml-2 text-[10px] bg-background-subtle px-1.5 py-0.5 rounded-full text-text-tertiary">0</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                <>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonJobCard
                      key={index}
                      className="h-full group hover:shadow-lg transition-all duration-300"
                    />
                  ))}
                </>
              ) : error ? (
                <div className="col-span-full py-24 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-error-50 dark:bg-error-900/30 flex items-center justify-center border border-error-100 dark:border-error-800/30 mb-8">
                    <AlertCircle className="w-8 h-8 text-error-500" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">Unable to load content</h3>
                  <p className="text-[15px] text-text-tertiary font-medium mt-3 max-w-sm text-center leading-relaxed">
                    There was an issue fetching the current data. This might be due to a temporary network problem.
                  </p>
                  <Button
                    onClick={handleRefresh}
                    className="mt-10 h-12 px-10 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-primary-600/20 transition-all active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Fetch
                  </Button>
                </div>
              ) : isSearchMode || activeTab === 'recommended' ? (
                jobs.length === 0 ? (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center border border-primary-100 dark:border-primary-800/30 mb-8">
                      <Search className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">No results found</h3>
                    <p className="text-[15px] text-text-tertiary font-medium mt-3 max-w-sm text-center leading-relaxed">
                      We couldn't find any jobs matching your current search or filters. Try broadening your keywords.
                    </p>
                    <Button
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="mt-8 h-11 px-8 rounded-xl text-primary-600 font-bold uppercase tracking-wider text-[11px] hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSelected={selectedJob?.id === job.id}
                      onSelect={handleJobSelect}
                      className="h-full hover:shadow-xl transition-all duration-300"
                    />
                  ))
                )
              ) : activeTab === 'applied' ? (
                applications.length === 0 ? (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center border border-success-100 dark:border-success-800/30 mb-8">
                      <Briefcase className="w-8 h-8 text-success-500" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">No applications yet</h3>
                    <p className="text-[15px] text-text-tertiary font-medium mt-3 max-w-sm text-center leading-relaxed">
                      Your journey starts here. Explore our personalized recommendations and apply to roles that fit your skills.
                    </p>
                    <Button
                      onClick={() => setActiveTab('recommended')}
                      className="mt-10 h-12 px-10 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-primary-600/20 transition-all active:scale-95"
                    >
                      Browse Recommended Jobs
                    </Button>
                  </div>
                ) : (
                  applications.map((app: Application) => (
                    <Card key={app.id} className="p-6 border-border-default hover:border-primary-200 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md overflow-hidden rounded-[32px] bg-background-surface">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 shadow-sm transition-transform group-hover:scale-110 duration-300">
                            {app.company_name?.substring(0, 2).toUpperCase() || 'JB'}
                          </div>
                          <Badge
                            variant="subtle"
                            className={cn(
                              "font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded-full border-none",
                              app.status === 'applied' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" :
                                app.status === 'interviewing' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                                  "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            )}
                          >
                            {app.status}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-text-primary line-clamp-1 group-hover:text-primary-600 transition-colors tracking-tight">
                            {app.job_title}
                          </h3>
                          <p className="text-sm text-text-tertiary font-medium mt-1 uppercase tracking-wider text-[10px] opacity-70 italic">{app.company_name}</p>
                        </div>
                      </div>
                      <div className="pt-6 mt-8 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                          Applied {new Date(app.applied_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="px-4 py-2 bg-background-subtle rounded-xl border border-border-subtle group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer shadow-sm">
                          Details
                        </div>
                      </div>
                    </Card>
                  ))
                )
              ) : (
                <div className="col-span-full py-24 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center border border-warning-100 dark:border-warning-800/30 mb-8">
                    <Bookmark className="w-8 h-8 text-warning-500" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">Saved jobs coming soon</h3>
                  <p className="text-[15px] text-text-tertiary font-medium mt-3 max-w-sm text-center leading-relaxed">
                    We're building a simpler way for you to bookmark and organize roles you're interested in. Stay tuned!
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && totalJobs > 0 && (activeTab === 'recommended' || isSearchMode) && (
              <div className="mt-16 flex justify-center">
                <div className="flex items-center gap-2 bg-background-surface rounded-2xl p-2 shadow-sm border border-border-subtle">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 disabled:opacity-30 transition-colors"
                  >
                    <Clock className="w-5 h-5 -rotate-90" />
                  </Button>
                  <span className="text-sm font-bold text-text-secondary px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-10 w-10 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/30 disabled:opacity-30 transition-colors"
                  >
                    <Clock className="w-5 h-5 rotate-90" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </AnimatedContainer>

        <JobDetailsModal
          job={selectedJob}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onApply={handleJobApply}
          showApplyButton
        />
      </div>
      </div>
    </AppShell>
  )
}
