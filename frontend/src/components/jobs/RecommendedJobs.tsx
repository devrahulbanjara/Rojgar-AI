'use client';

import React from 'react';
import { useRecommendedJobs } from '../../hooks/queries/useJobs';
import { JobCard } from './JobCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { SectionHeader } from '../common/SectionHeader';

interface RecommendedJobsProps {
  limit?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Recommended Jobs Component
 * Displays personalized job recommendations using the new recommendations endpoint
 */
export function RecommendedJobs({
  limit = 5,
  title = "Recommended for You",
  subtitle = "Jobs matched to your profile and preferences",
  className = ""
}: RecommendedJobsProps) {
  const { data: jobsData, isLoading, error } = useRecommendedJobs(limit);

  const jobs = jobsData?.jobs || [];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <SectionHeader title={title} subtitle={subtitle} />
        <EmptyState
          title="Unable to load recommendations"
          description="There was an error loading your job recommendations. Please try again later."
          action={{
            label: "Try Again",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <SectionHeader title={title} subtitle={subtitle} />
        <EmptyState
          title="No recommendations yet"
          description="We're working on finding the perfect jobs for you. Check back soon!"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionHeader title={title} subtitle={subtitle} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            showCompanyLogo={true}
            showSalary={true}
            showLocation={true}
            showPostedDate={true}
            className="h-full"
          />
        ))}
      </div>
    </div>
  );
}
