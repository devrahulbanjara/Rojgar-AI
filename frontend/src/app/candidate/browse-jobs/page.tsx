'use client';

export const dynamic = 'force-dynamic';

/**
 * Jobs Page - LinkedIn-Inspired Design
 * Professional job browsing experience with two-column layout
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useJobSearch, useCreateApplication } from '../../../hooks/queries/useJobs';
import { JobSearchBar, JobList, JobDetailView } from '../../../components/jobs';
import { AppShell } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { AnimatedContainer, PageHeader } from '../../../components/common';
import { 
  X, 
  TrendingUp
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Job, JobFilters as JobFiltersType } from '../../../types/job';

export default function Jobs() {
  const [filters, setFilters] = useState<JobFiltersType>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sortBy, setSortBy] = useState<'postedDate' | 'salary'>('postedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use real API calls with search endpoint
  const { data: jobsData, isLoading, error } = useJobSearch({
    page: 1,
    limit: 20,
    ...filters,
    sort_by: sortBy === 'postedDate' ? 'posted_date' : sortBy,
    sort_order: sortOrder
  });

  // Create application mutation
  const createApplicationMutation = useCreateApplication();

  // Get jobs from API response
  const jobs = jobsData?.jobs || [];

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<JobFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
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
            <PageHeader
              title="Find Your Next Opportunity"
              subtitle="Discover jobs that match your skills and career goals"
            />
          </AnimatedContainer>

          {/* Search and Filters Bar */}
          <AnimatedContainer direction="up" delay={0.2}>
            <div 
              className="bg-white rounded-2xl border border-[#E5E7EB] p-6"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <JobSearchBar
                  value={filters.search || ''}
                  onChange={(value) => handleFiltersChange({ search: value })}
                  placeholder="Search jobs, companies, or keywords..."
                />
              </div>

              {/* Sort Dropdown - Only 4 options: Posted Date (Latest/Oldest) and Salary (Highest/Lowest) */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="h-11 px-4 bg-white border-[1.5px] border-[#E5E7EB] rounded-xl text-sm font-medium text-[#475569] focus:outline-none focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10 transition-all"
                >
                  <option value="postedDate-desc">Posted Date (Latest)</option>
                  <option value="postedDate-asc">Posted Date (Oldest)</option>
                  <option value="salary-desc">Salary (Highest)</option>
                  <option value="salary-asc">Salary (Lowest)</option>
                </select>
              </div>
            </div>

            {/* Filters removed */}
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
                    <h2 className="text-lg font-semibold text-[#0F172A]">
                      {isLoading ? 'Loading...' : `${jobs.length} Jobs Found`}
                    </h2>
                    {!isLoading && jobs.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-[#94A3B8]">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Updated just now</span>
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
