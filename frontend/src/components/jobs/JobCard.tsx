/**
 * JobCard Component - LinkedIn-Inspired Design
 * Displays job information in a clean, modern card layout with selection state
 */

import React from 'react';
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

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected = false,
  onSelect,
  onApply,
  showApplyButton = false,
  className
}) => {
  const handleClick = () => {
    onSelect?.(job);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply?.(job);
  };

  return (
    <Card 
      className={cn(
        'group cursor-pointer transition-all duration-300 ease-out border-border/50',
        'hover:border-border hover:shadow-lg hover:-translate-y-1',
        'hover:scale-[1.02] active:scale-[0.98]',
        isSelected && 'border-primary shadow-md bg-primary/5 scale-[1.02]',
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
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {job.company?.logo ? (
              <img 
                src={job.company.logo} 
                alt={job.company.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Job Content */}
          <div className="flex-1 min-w-0">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{jobUtils.formatPostedDate(job.posted_date)}</span>
              </div>
            </div>

            {/* Job Details */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm mb-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  {jobUtils.formatSalaryRange(job.salary_range)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{job.employment_type}</span>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {job.skills.slice(0, 3).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-2 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{job.skills.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Job Description Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {job.description}
            </p>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {job.applicant_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{job.applicant_count} applicants</span>
                  </div>
                )}
                {job.views_count !== undefined && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{job.views_count} views</span>
                  </div>
                )}
              </div>

              {/* Job Level Badge */}
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs font-medium px-2 py-1 self-start sm:self-auto',
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
};
