'use client';

export const dynamic = 'force-dynamic';

/**
 * Jobs Page - LinkedIn-Inspired Design
 * Professional job browsing experience with two-column layout
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { usePersonalizedRecommendations, useCreateApplication } from '../../../hooks/queries/useJobs';
import { useAuth } from '../../../hooks/useAuth';
import { JobSearchBar, JobList, JobDetailView } from '../../../components/jobs';
import { AppShell } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { AnimatedContainer, PageHeader, AIPoweredBadge, LoadingSpinner } from '../../../components/common';
import { 
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Job, JobFilters as JobFiltersType } from '../../../types/job';

export default function Jobs() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current user for personalized recommendations
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isAuthLoading]);

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

  // Use personalized recommendations instead of search
  const { data: jobsData, isLoading, error, refetch } = usePersonalizedRecommendations(
    user?.id || '', 
    currentPage, 
    10
  );

  // Create application mutation
  const createApplicationMutation = useCreateApplication();

  // Handle cache refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
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
            const cacheData = JSON.parse(cached);
            const newCache: Record<string, any> = {};
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
      
      toast.success('Job recommendations refreshed');
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
      toast.error('Failed to refresh recommendations');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetch]);

  // Get jobs from API response
  const jobs = jobsData?.jobs || [];

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
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
    } catch (error) {
      // Handle application error silently
    }
  }, [createApplicationMutation]);

  return (
    <AppShell>
      <div className="space-y-8">
          {/* Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="flex items-center justify-between">
              <PageHeader
                title="Recommended for You"
                subtitle="Jobs matched to your skills and experience"
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
                        {isLoading ? 'Loading...' : `Recommended Jobs (${jobsData?.total || 0})`}
                      </h2>
                      <p className="text-sm text-[#64748B] mt-1">
                        Sorted by relevance to your skills
                      </p>
                    </div>
                    {!isLoading && jobs.length > 0 && (
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
                {jobsData && jobsData.total_pages > 1 && (
                  <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFBFC]">
                    <div className="flex items-center justify-start">
                      <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-[#E5E7EB]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!jobsData.has_prev}
                          className="h-8 w-8 p-0 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Button>
                        
                        <div className="flex items-center gap-1 mx-2">
                          {Array.from({ length: Math.min(5, jobsData.total_pages) }, (_, i) => {
                            let pageNum;
                            if (jobsData.total_pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= jobsData.total_pages - 2) {
                              pageNum = jobsData.total_pages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={`h-8 w-8 p-0 text-sm font-medium ${
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
                          disabled={!jobsData.has_next}
                          className="h-8 w-8 p-0 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </div>
                      
                      <div className="ml-4">
                        <span className="text-xs text-[#94A3B8] bg-white px-3 py-1 rounded-full border border-[#E5E7EB]">
                          {currentPage} of {jobsData.total_pages} pages
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
