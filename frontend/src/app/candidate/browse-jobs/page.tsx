"use client";

export const dynamic = "force-dynamic";

/**
 * Jobs Page - LinkedIn-Inspired Design
 * Professional job browsing experience with grid layout
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  usePersonalizedRecommendations,
  useCreateApplication,
  useJobSearch,
} from "../../../hooks/queries/useJobs";
import { useAuth } from "../../../hooks/useAuth";
import {
  JobCard,
  JobSearchBar,
  FilterChips,
  type FilterType,
} from "../../../components/jobs";
import { JobDetailsModal } from "../../../components/jobs/JobDetailsModal";
import { AppShell } from "../../../components/layout/AppShell";
import { Button } from "../../../components/ui/button";
import {
  AnimatedContainer,
  PageHeader,
  AIPoweredBadge,
  LoadingSpinner,
  SkeletonJobCard,
} from "../../../components/common";
import { RefreshCw, AlertCircle, Search, Filter } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Job } from "../../../types/job";

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

  // Get current user for personalized recommendations
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Determine if we're in search mode (only when there's a search query)
  // Filters can be applied to both recommendations and search results
  const isSearchMode = debouncedSearchQuery.trim().length > 0;

  // Convert filter types to backend filter format
  const backendFilters = useMemo(() => {
    const filters: { employmentType?: string; locationType?: string } = {};

    // Map active filters to backend format
    activeFilters.forEach((filter) => {
      switch (filter) {
        case "remote":
          filters.locationType = "Remote";
          break;
        case "hybrid":
          filters.locationType = "Hybrid";
          break;
        case "full-time":
          filters.employmentType = "Full-time";
          break;
        case "part-time":
          filters.employmentType = "Part-time";
          break;
        case "contract":
          filters.employmentType = "Contract";
          break;
      }
    });

    return filters;
  }, [activeFilters]);

  // Use personalized recommendations when not searching
  // IMPORTANT: All hooks must be called unconditionally before any early returns
  const shouldFetchRecommendations = !isSearchMode && !!user?.id;
  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = usePersonalizedRecommendations(
    user?.id || "",
    currentPage,
    12,
    backendFilters,
  );

  // Use job search when searching
  const shouldFetchSearch =
    isSearchMode && debouncedSearchQuery.trim().length > 0;
  const {
    data: searchData,
    isLoading: isLoadingSearch,
    error: searchError,
  } = useJobSearch(
    shouldFetchSearch
      ? {
          search: debouncedSearchQuery.trim(),
          page: currentPage,
          limit: 12,
          ...backendFilters,
        }
      : undefined,
  );

  // Determine which data source to use
  const jobsData = isSearchMode ? searchData : recommendationsData;
  const isLoading = isSearchMode
    ? shouldFetchSearch
      ? isLoadingSearch
      : false
    : shouldFetchRecommendations
      ? isLoadingRecommendations
      : false;
  const error = isSearchMode ? searchError : recommendationsError;
  const refetch = isSearchMode ? () => {} : refetchRecommendations;

  // Create application mutation
  const createApplicationMutation = useCreateApplication();

  // Handle cache refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (isSearchMode) {
        // Invalidate search queries
        await queryClient.invalidateQueries({
          queryKey: ["jobs", "search"],
          refetchType: "active",
        });
      } else {
        // Invalidate all job-related queries
        await queryClient.invalidateQueries({
          queryKey: ["jobs", "personalized"],
          refetchType: "active",
        });

        // Also clear localStorage cache for jobs
        if (typeof window !== "undefined") {
          try {
            const cacheKey = "convexhire-query-cache";
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const cacheData = JSON.parse(cached) as Record<string, unknown>;
              const newCache: Record<string, unknown> = {};
              // Remove all job-related entries
              Object.entries(cacheData).forEach(([key, value]) => {
                try {
                  const queryKey = JSON.parse(key);
                  // Keep only non-job related queries
                  if (!Array.isArray(queryKey) || queryKey[0] !== "jobs") {
                    newCache[key] = value;
                  }
                } catch {
                  // If key is not valid JSON, keep it (shouldn't happen but safe)
                  if (!key.includes("jobs")) {
                    newCache[key] = value;
                  }
                }
              });
              localStorage.setItem(cacheKey, JSON.stringify(newCache));
            }
          } catch (e) {
            console.warn("Failed to clear localStorage cache:", e);
          }
        }

        // Force refetch
        await refetch();
      }

      toast.success(
        isSearchMode
          ? "Search results refreshed"
          : "Job recommendations refreshed",
      );
    } catch (error) {
      console.error("Failed to refresh:", error);
      toast.error("Failed to refresh");
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
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setCurrentPage(1);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle job selection
  const handleJobSelect = useCallback((job: Job) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setTimeout(() => setSelectedJob(null), 300);
  }, []);

  // Handle job application
  const handleJobApply = useCallback(
    async (job: Job) => {
      try {
        await createApplicationMutation.mutateAsync({
          jobId: job.id.toString(),
        });
        // Show success message or redirect
      } catch {
        // Handle application error silently
      }
    },
    [createApplicationMutation],
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isAuthLoading]);

  // Get jobs from API response (filters are applied on backend)
  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;
  const totalPages = jobsData?.total_pages || 0;

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
                <RefreshCw
                  className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                />
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

        {/* Main Content - Job Cards Grid */}
        <AnimatedContainer direction="up" delay={0.3}>
          <div className="w-full">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    {isLoading
                      ? "Loading..."
                      : `${isSearchMode ? "Search Results" : "Recommended Jobs"} (${totalJobs})`}
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">
                    {isSearchMode
                      ? "Semantic search results"
                      : "Sorted by relevance to your skills"}
                  </p>
                </div>
                {!isLoading && jobs.length > 0 && !isSearchMode && (
                  <div className="hidden sm:block">
                    <AIPoweredBadge />
                  </div>
                )}
              </div>
            </div>

            {/* Job Cards Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isLoading ? (
                <>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <SkeletonJobCard
                      key={index}
                      className="bg-card border border-border rounded-xl"
                    />
                  ))}
                </>
              ) : error ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(220, 38, 38, 0.1)" }}
                  >
                    <AlertCircle className="w-8 h-8 text-[#DC2626]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                      Failed to load jobs
                    </h3>
                    <p className="text-sm text-[#475569] text-center max-w-md mb-4">
                      {error.message}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm text-[#3056F5] hover:text-[#2B3CF5] hover:underline font-medium"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(48, 86, 245, 0.08)" }}
                  >
                    <Search className="w-8 h-8 text-[#3056F5]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                      No jobs found
                    </h3>
                    <p className="text-sm text-[#475569] text-center max-w-md mb-4">
                      Try adjusting your search criteria or check back later for
                      new opportunities.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <Filter className="w-4 h-4" />
                      <span>Try different filters or search terms</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSelected={selectedJob?.id === job.id}
                      onSelect={handleJobSelect}
                      onApply={handleJobApply}
                      showApplyButton={false}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && totalJobs > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-[#E5E7EB]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                              variant={
                                currentPage === pageNum ? "default" : "ghost"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-8 w-8 p-0 text-sm font-medium cursor-pointer ${
                                currentPage === pageNum
                                  ? "bg-[#3056F5] text-white shadow-sm"
                                  : "hover:bg-[#F8FAFC] text-[#64748B]"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="h-8 w-8 p-0 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
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
        </AnimatedContainer>

        {/* Job Details Modal */}
        <JobDetailsModal
          job={selectedJob}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          onApply={handleJobApply}
          showApplyButton={true}
        />
      </div>
    </AppShell>
  );
}
