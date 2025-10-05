'use client';

export const dynamic = 'force-dynamic';

/**
 * Jobs Page - LinkedIn-Inspired Design
 * Professional job browsing experience with two-column layout
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useJobs, useCreateApplication } from '../../../hooks/queries/useJobs';
import { JobSearchBar, JobFilters, JobList, JobDetailView } from '../../../components/jobs';
import { AppShell } from '../../../components/layout/AppShell';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { AnimatedContainer } from '../../../components/common';
import { 
  Filter, 
  SlidersHorizontal, 
  X, 
  Search,
  MapPin,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../../design-system/components';
import type { Job, JobFilters as JobFiltersType } from '../../../types/job';

export default function Jobs() {
  const [filters, setFilters] = useState<JobFiltersType>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'postedDate' | 'salary' | 'title' | 'company'>('postedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use real API calls
  const { data: jobsData, isLoading, error } = useJobs({
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
      console.error('Failed to apply to job:', error);
    }
  }, [createApplicationMutation]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  }, [filters]);

  // Sort options
  const sortOptions = [
    { value: 'postedDate', label: 'Posted Date' },
    { value: 'salary', label: 'Salary' },
    { value: 'title', label: 'Job Title' },
    { value: 'company', label: 'Company' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
          {/* Header */}
          <AnimatedContainer direction="up" delay={0.1}>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Your Next Opportunity</h1>
            <p className="text-slate-600">Discover jobs that match your skills and career goals</p>
          </AnimatedContainer>

          {/* Search and Filters Bar */}
          <AnimatedContainer direction="up" delay={0.2}>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <JobSearchBar
                  value={filters.search || ''}
                  onChange={(value) => handleFiltersChange({ search: value })}
                  placeholder="Search jobs, companies, or keywords..."
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2",
                    showFilters && "bg-primary text-primary-foreground"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Sort Dropdown */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {sortOptions.map(option => (
                    <React.Fragment key={option.value}>
                      <option value={`${option.value}-desc`}>{option.label} (Newest)</option>
                      <option value={`${option.value}-asc`}>{option.label} (Oldest)</option>
                    </React.Fragment>
                  ))}
                </select>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                <JobFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  compact={true}
                />
              </div>
            )}
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
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-200px)] flex flex-col">
                <div className="p-4 lg:p-6 border-b border-slate-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {isLoading ? 'Loading...' : `${jobs.length} Jobs Found`}
                    </h2>
                    {!isLoading && jobs.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-slate-500">
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
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-200px)] relative flex flex-col">
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    aria-label="Close job details"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                  
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <JobDetailView
                      job={selectedJob}
                      onApply={() => handleJobApply(selectedJob)}
                      showApplyButton={true}
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
