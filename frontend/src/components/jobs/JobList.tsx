/**
 * JobList Component - LinkedIn-Inspired Design
 * Displays a list of jobs with enhanced UX and selection state
 */

import React, { memo, useMemo } from 'react';
import { JobCard } from './JobCard';
import { SkeletonJobCard, StaggerContainer } from '../common';
import { cn } from '../../lib/utils';
import type { Job } from '../../types/job';
import { AlertCircle, Search, Filter } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  loading?: boolean;
  error?: string | null;
  selectedJob?: Job | null;
  onJobSelect?: (job: Job) => void;
  onApply?: (job: Job) => void;
  className?: string;
}

export const JobList = memo<JobListProps>(({
  jobs,
  loading = false,
  error,
  selectedJob,
  onJobSelect,
  onApply,
  className
}) => {
  /*
   * Deduplicate jobs based on ID to prevent "duplicate key" warnings
   * This handles cases where the backend/recommendation engine might return
   * the same job multiple times (e.g. from different vector matches)
   */
  const uniqueJobs = useMemo(() => {
    if (!jobs) return [];
    const seen = new Set();
    return jobs.filter(job => {
      const id = job.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [jobs]);

  if (loading) {
    return (
      <StaggerContainer className="space-y-4" staggerDelay={0.08}>
        {/* Enhanced Loading Skeletons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonJobCard
            key={index}
            className="bg-card border border-border rounded-xl"
          />
        ))}
      </StaggerContainer>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(220, 38, 38, 0.1)' }}
        >
          <AlertCircle className="w-8 h-8 text-[#DC2626]" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Failed to load jobs</h3>
          <p className="text-sm text-[#475569] text-center max-w-md mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[#3056F5] hover:text-[#2B3CF5] hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!uniqueJobs || uniqueJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(48, 86, 245, 0.08)' }}
        >
          <Search className="w-8 h-8 text-[#3056F5]" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No jobs found</h3>
          <p className="text-sm text-[#475569] text-center max-w-md mb-4">
            Try adjusting your search criteria or check back later for new opportunities.
          </p>
          <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <Filter className="w-4 h-4" />
            <span>Try different filters or search terms</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {uniqueJobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isSelected={selectedJob?.id === job.id}
          onSelect={onJobSelect}
          onApply={onApply}
          showApplyButton={false} // Apply button is now in the detail view
        />
      ))}
    </div>
  );
});

JobList.displayName = 'JobList';
