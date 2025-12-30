'use client';

export const dynamic = 'force-dynamic';

/**
 * Jobs Page - LinkedIn-Inspired Design
 * Professional job browsing experience with two-column layout
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { usePersonalizedRecommendations, useCreateApplication, useJobSearch } from '../../../hooks/queries/useJobs';
import { useAuth } from '../../../hooks/useAuth';
import { JobList, JobDetailView, JobSearchBar, FilterChips, type FilterType } from '../../../components/jobs';
import { AppShell } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/button';
import { AnimatedContainer, PageHeader, AIPoweredBadge, LoadingSpinner } from '../../../components/common';
import {
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Job } from '../../../types/job';

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

  // Get current user for personalized recommendations
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Determine if we're in search mode (only when there's a search query)
  // Filters can be applied to both recommendations and search results
  const isSearchMode = debouncedSearchQuery.trim().length > 0;

  // Use personalized recommendations when not searching
  // IMPORTANT: All hooks must be called unconditionally before any early returns
  const shouldFetchRecommendations = !isSearchMode && !!user?.id;
  const { data: recommendationsData, isLoading: isLoadingRecommendations, error: recommendationsError, refetch: refetchRecommendations } = usePersonalizedRecommendations(
    user?.id || '',
    currentPage,
    10
  );

  // Use job search when searching
  const shouldFetchSearch = isSearchMode && debouncedSearchQuery.trim().length > 0;
  const { data: searchData, isLoading: isLoadingSearch, error: searchError } = useJobSearch(
    shouldFetchSearch ? {
      search: debouncedSearchQuery.trim(),
      page: currentPage,
      limit: 10,
    } : undefined
  );

  // Determine which data source to use
  const jobsData = isSearchMode ? searchData : recommendationsData;
  const isLoading = isSearchMode ? (shouldFetchSearch ? isLoadingSearch : false) : (shouldFetchRecommendations ? isLoadingRecommendations : false);
  const error = isSearchMode ? searchError : recommendationsError;
  const refetch = isSearchMode ? () => {} : refetchRecommendations;

  // Create application mutation
  const createApplicationMutation = useCreateApplication();

  // Apply filters to jobs (client-side filtering for now)
  const filteredJobs = useMemo(() => {
    const jobs = jobsData?.jobs || [];
    if (activeFilters.length === 0) return jobs;

    return jobs.filter((job) => {
      return activeFilters.some((filter) => {
        switch (filter) {
          case 'remote':
            return job.location_type === 'Remote' || job.is_remote;
          case 'full-time':
            return job.employment_type === 'Full-time';
          case 'part-time':
            return job.employment_type === 'Part-time';
          case 'contract':
            return job.employment_type === 'Contract';
          case 'hybrid':
            return job.location_type === 'Hybrid';
          default:
            return false;
        }
      });
    });
  }, [jobsData?.jobs, activeFilters]);

  // Handle cache refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isSearchMode) {
        // Invalidate search queries
        await queryClient.invalidateQueries({
          queryKey: ['jobs', 'search'],
          refetchType: 'active'
        });
      } else {
        // Invalidate all job-related queries
        await queryClient.invalidateQueries({
          queryKey: ['jobs', 'personalized'],
          refetchType: 'active'
        });

        // Also clear localStorage cache for jobs
        if (typeof window !== 'undefined') {
          try {
            const cacheKey = 'convexhire-query-cache';
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const cacheData = JSON.parse(cached) as Record<string, unknown>;
              const newCache: Record<string, unknown> = {};
              // Remove all job-related entries
              Object.entries(cacheData).forEach(([key, value]) => {
                try {
                  const queryKey = JSON.parse(key);
                  // Keep only non-job related queries
                  if (!Array.isArray(queryKey) || queryKey[0] !== 'jobs') {
                    newCache[key] = value;
                  }
                } catch {
                  // If key is not valid JSON, keep it (shouldn't happen but safe)
                  if (!key.includes('jobs')) {
                    newCache[key] = value;
                  }
                }
              });
              localStorage.setItem(cacheKey, JSON.stringify(newCache));
            }
          } catch (e) {
            console.warn('Failed to clear localStorage cache:', e);
          }
        }

        // Force refetch
        await refetch();
      }

      toast.success(isSearchMode ? 'Search results refreshed' : 'Job recommendations refreshed');
    } catch (error) {
      console.error('Failed to refresh:', error);
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetch, isSearchMode]);

  // Handle search query change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle debounced search query change
  const handleDebouncedSearchChange = useCallback((value: string) => {
    setDebouncedSearchQuery(value);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  // Handle filter toggle
  const handleFilterToggle = useCallback((filter: FilterType) => {
    setActiveFilters((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((f) => f !== filter);
      }
      return [...prev, filter];
    });
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  // Handle clear all filters
  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle job selection
  const handleJobSelect = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  // Handle job application
  const handleJobApply = useCallback(async (job: Job) => {
    try {
      await createApplicationMutation.mutateAsync({
        jobId: job.id.toString(),
      });
      // Show success message or redirect
    } catch {
      // Handle application error silently
    }
  }, [createApplicationMutation]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isAuthLoading]);

  // Get jobs from API response (apply filters if in search mode)
  const jobs = isSearchMode ? filteredJobs : (jobsData?.jobs || []);
  
  // Calculate total for filtered results
  // For search mode with filters, use filtered length; otherwise use API total
  const totalJobs = isSearchMode 
    ? (activeFilters.length > 0 ? filteredJobs.length : (jobsData?.total || 0))
    : (jobsData?.total || 0);
  
  // Calculate total pages for pagination
  const totalPages = isSearchMode && activeFilters.length > 0
    ? Math.ceil(filteredJobs.length / 10)
    : (jobsData?.total_pages || 0);

  // Show loading state while checking authentication
  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
          {/* Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <PageHeader
                  title={isSearchMode ? "Search Results" : "Recommended for You"}
                  subtitle={
                    isSearchMode
                      ? debouncedSearchQuery
                        ? `${totalJobs} results for "${debouncedSearchQuery}"`
                        : `${totalJobs} results`
                      : "Jobs matched to your skills and experience"
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {/* Search Bar */}
              <div className="space-y-3">
                <JobSearchBar
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onDebouncedChange={handleDebouncedSearchChange}
                  loading={isLoadingSearch}
                  placeholder="Search by job title, company, or skills"
                />

                {/* Filter Chips - Show available filters for quick access */}
                <FilterChips
                  activeFilters={activeFilters}
                  onFilterToggle={handleFilterToggle}
                  onClearAll={handleClearFilters}
                  showAvailable={true}
                />
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content */}
          <AnimatedContainer direction="up" delay={0.3}>
            <div className="flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Job List - Responsive Width */}
            <div className={`transition-all duration-300 flex-shrink-0 ${
              selectedJob
                ? 'lg:w-1/2 w-full'
                : 'w-full'
            }`}>
              <div
                className="bg-white rounded-2xl border border-[#E5E7EB] h-[calc(100vh-200px)] flex flex-col"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="p-6 border-b border-[#E5E7EB] flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#0F172A]">
                        {isLoading ? 'Loading...' : `${isSearchMode ? 'Search Results' : 'Recommended Jobs'} (${totalJobs})`}
                      </h2>
                      <p className="text-sm text-[#64748B] mt-1">
                        {isSearchMode
                          ? 'Semantic search results'
                          : 'Sorted by relevance to your skills'}
                      </p>
                    </div>
                    {!isLoading && jobs.length > 0 && !isSearchMode && (
                      <div className="hidden sm:block">
                        <AIPoweredBadge />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <div className="p-2 lg:p-4">
                    <JobList
                      jobs={jobs}
                      loading={isLoading}
                      error={error?.message}
                      selectedJob={selectedJob}
                      onJobSelect={handleJobSelect}
                      onApply={handleJobApply}
                    />
                  </div>
                </div>

                {/* Pagination - Bottom Left */}
                {totalPages > 1 && totalJobs > 0 && (
                  <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFBFC]">
                    <div className="flex items-center justify-start">
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-[#E5E7EB]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Button>

                        <div className="flex items-center gap-1 mx-2">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={`h-8 w-8 p-0 text-sm font-medium cursor-pointer ${
                                  currentPage === pageNum
                                    ? 'bg-[#3056F5] text-white shadow-sm'
                                    : 'hover:bg-[#F8FAFC] text-[#64748B]'
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="h-8 w-8 p-0 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </div>

                      <div className="ml-4">
                        <span className="text-xs text-[#94A3B8] bg-white px-3 py-1 rounded-full border border-[#E5E7EB]">
                          {currentPage} of {totalPages} pages
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Detail Panel - Responsive */}
            {selectedJob && (
              <AnimatedContainer
                direction="right"
                delay={0.1}
                className="lg:w-1/2 w-full flex-shrink-0"
              >
                <div
                  className="bg-white rounded-2xl border border-[#E5E7EB] h-[calc(100vh-200px)] relative flex flex-col"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[#F9FAFB] transition-colors"
                    aria-label="Close job details"
                  >
                    <X className="h-5 w-5 text-[#475569]" />
                  </button>

                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <JobDetailView
                      job={selectedJob}
                      onApply={() => handleJobApply(selectedJob)}
                    />
                  </div>
                </div>
              </AnimatedContainer>
            )}
            </div>
          </AnimatedContainer>
        </div>
    </AppShell>
  );
}
