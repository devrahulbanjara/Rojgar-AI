/**
 * JobCard Component - LinkedIn-Inspired Design
 * Displays job information in a clean, modern card layout with selection state
 */

import React, { memo, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  MapPin, 
  DollarSign, 
  Building2, 
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../design-system/components';
import { jobUtils } from '../../services/jobService';
import type { Job } from '../../types/job';

interface JobCardProps {
  job: Job;
  isSelected?: boolean;
  onSelect?: (job: Job) => void;
  onApply?: (job: Job) => void;
  showApplyButton?: boolean;
  className?: string;
}

export const JobCard = memo<JobCardProps>(({
  job,
  isSelected = false,
  onSelect,
  onApply,
  showApplyButton = false,
  className
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(job);
  }, [onSelect, job]);

  const handleApply = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onApply?.(job);
  }, [onApply, job]);

  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1) border-border/50',
        'hover:border-border hover:shadow-md hover:-translate-y-0.5',
        'hover:scale-[1.01] active:scale-[0.99] w-full',
        isSelected && 'border-primary shadow-md bg-primary/5 scale-[1.01]',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${job.title} at ${job.company?.name || 'Company'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {job.company?.logo ? (
              <img 
                src={job.company.logo} 
                alt={job.company.name}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Job Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Job Title & Company */}
            <div className="mb-2">
              <h3 className={cn(
                'font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1',
                isSelected && 'text-primary'
              )}>
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                {job.company?.name || 'Company'}
              </p>
            </div>

            {/* Location & Posted Date */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 lg:mb-3">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{jobUtils.formatPostedDate(job.posted_date)}</span>
              </div>
            </div>

            {/* Job Details */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 text-xs sm:text-sm mb-2 lg:mb-3">
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-medium truncate">
                  {jobUtils.formatSalaryRange(job.salary_range)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{job.employment_type}</span>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 lg:mb-3">
                {job.skills.slice(0, 2).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-1.5 py-0.5"
                  >
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{job.skills.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Job Description Preview */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 lg:mb-3 leading-relaxed">
              {job.description}
            </p>

            {/* Footer */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-2">
              <div className="flex items-center gap-2 lg:gap-4 text-xs text-muted-foreground">
                {job.applicant_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="whitespace-nowrap">{job.applicant_count} applicants</span>
                  </div>
                )}
                {job.views_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="whitespace-nowrap">{job.views_count} views</span>
                  </div>
                )}
              </div>

              {/* Job Level Badge */}
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 self-start lg:self-auto',
                  jobUtils.getJobLevelColor(job.level)
                )}
              >
                {job.level}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

JobCard.displayName = 'JobCard';
