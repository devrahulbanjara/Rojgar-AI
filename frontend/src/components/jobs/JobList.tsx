/**
 * JobList Component - LinkedIn-Inspired Design
 * Displays a list of jobs with enhanced UX and selection state
 */

import React from 'react';
import { JobCard } from './JobCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState, SkeletonJobCard } from '../common';
import { cn } from '../../design-system/components';
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

export const JobList: React.FC<JobListProps> = ({
  jobs,
  loading = false,
  error,
  selectedJob,
  onJobSelect,
  onApply,
  className
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Enhanced Loading Skeletons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div 
            key={index} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <SkeletonJobCard className="bg-card border border-border rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load jobs</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Try adjusting your search criteria or check back later for new opportunities.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Try different filters or search terms</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {jobs.map((job) => (
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
};
