/**
 * Jobs Page - LinkedIn-Inspired Design
 * Professional job browsing experience with two-column layout
 */

import { useState, useMemo, useCallback } from 'react';
import { useJobs, useCreateApplication } from '../../hooks/queries/useJobs';
import { JobSearchBar, JobFilters, JobList, JobDetailView } from '../../components/jobs';
import { PageTransition } from '../../components/common/PageTransition';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
import { cn } from '../../design-system/components';
import type { Job, JobFilters as JobFiltersType } from '../../types/job';

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

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Handle job selection
  const handleJobSelect = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  // Handle apply to job
  const handleApply = useCallback(async (job: Job) => {
    try {
      await createApplicationMutation.mutateAsync({
        jobId: job.id,
        candidateId: 'current-user-id', // TODO: Get from auth context
        coverLetter: '',
        resume: null,
      });
      
      // TODO: Show success toast
      console.log('Application submitted successfully');
    } catch (error) {
      console.error('Failed to submit application:', error);
      // TODO: Show error toast
    }
  }, [createApplicationMutation]);

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => 
    Object.values(filters).some(value => 
      value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
    ), [filters]
  );

  // Get active filter count
  const activeFilterCount = useMemo(() => 
    Object.values(filters).filter(value => 
      value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
    ).length, [filters]
  );

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Fixed Top Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl animate-fade-in-left">
              <JobSearchBar
                value={filters.search || ''}
                onChange={(value) => handleFiltersChange({ search: value })}
                placeholder="Search jobs, companies, or skills..."
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-3 ml-4 animate-fade-in-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 hover-scale transition-smooth"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs animate-bounce-in">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilters && (
            <div className="pb-4 animate-slide-down">
              <JobFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Job List */}
          <div className={cn(
            "flex-1 transition-all duration-500 ease-out",
            selectedJob ? "lg:max-w-2xl" : "lg:max-w-none"
          )}>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in-up">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {jobsData?.total || 0} Job{(jobsData?.total || 0) !== 1 ? 's' : ''} Found
                </h1>
                {hasActiveFilters && (
                  <p className="text-sm text-muted-foreground mt-1 animate-fade-in">
                    Based on your filters
                  </p>
                )}
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 transition-smooth hover-scale"
                >
                  <option value="postedDate">Most Recent</option>
                  <option value="salary">Salary</option>
                  <option value="title">Job Title</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>

            {/* Jobs List */}
            <div className="animate-fade-in-up stagger-1">
              <JobList
                jobs={jobs}
                loading={isLoading}
                error={error?.message || null}
                selectedJob={selectedJob}
                onJobSelect={handleJobSelect}
                onApply={handleApply}
              />
            </div>
          </div>

          {/* Right Column - Job Detail View (Desktop) - Only show when job is selected */}
          {selectedJob && (
            <div className="hidden lg:block flex-1 animate-slide-in-right">
              <div className="sticky top-24">
                <div className="flex items-start justify-between mb-4 animate-fade-in-down">
                  <h2 className="text-lg font-semibold text-foreground">Job Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedJob(null)}
                    className="text-muted-foreground hover:text-foreground hover-scale transition-smooth"
                    aria-label="Close job details"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="animate-fade-in-up stagger-1">
                  <JobDetailView
                    job={selectedJob}
                    onApply={handleApply}
                    isApplying={createApplicationMutation.isPending}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Job Detail Modal */}
      {selectedJob && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background animate-fade-in">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border animate-slide-down">
              <h2 className="text-lg font-semibold text-foreground">Job Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedJob(null)}
                className="text-muted-foreground hover:text-foreground hover-scale transition-smooth"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Mobile Job Detail Content */}
            <div className="flex-1 overflow-y-auto animate-fade-in-up stagger-1">
              <JobDetailView
                job={selectedJob}
                onApply={handleApply}
                isApplying={createApplicationMutation.isPending}
                className="border-0 rounded-none"
              />
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}