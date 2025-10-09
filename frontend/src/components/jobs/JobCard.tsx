/**
 * JobCard Component - LinkedIn-Inspired Design
 * Displays job information in a clean, modern card layout with selection state
 */

import React, { memo, useCallback } from 'react';
import { 
  MapPin, 
  DollarSign, 
  Building2, 
  Users,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
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
    <div
      className={cn(
        'group cursor-pointer transition-all duration-200 w-full bg-white rounded-xl border p-4 lg:p-5',
        'hover:-translate-y-0.5 active:scale-[0.99]',
        isSelected 
          ? 'border-[#3056F5] shadow-md bg-[#3056F5]/5' 
          : 'border-[#E5E7EB] hover:border-[#CBD5E1]',
        className
      )}
      style={{
        boxShadow: isSelected ? '0 4px 12px rgba(48,86,245,0.12)' : '0 0 0 rgba(0,0,0,0)',
      }}
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
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)';
        }
      }}
    >
      <div className="space-y-3">
        {/* Job Title & Company */}
        <div>
          <h3 className={cn(
            'font-semibold text-base text-[#0F172A] group-hover:text-[#3056F5] transition-colors line-clamp-1 mb-1',
            isSelected && 'text-[#3056F5]'
          )}>
            {job.title}
          </h3>
          <p className="text-sm text-[#475569] font-medium">
            {job.company?.name || 'Company'}
          </p>
        </div>

        {/* Location & Posted Date */}
        <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{jobUtils.formatPostedDate(job.posted_date)}</span>
          </div>
        </div>

        {/* Job Details */}
        <div className="flex items-center gap-4 text-sm text-[#475569]">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">
              {jobUtils.formatSalaryRange(job.salary_range)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            <span>{job.employment_type}</span>
          </div>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index} 
                className="px-2 py-1 bg-[#F9FAFB] text-[#3056F5] text-xs font-medium rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="px-2 py-1 bg-[#F9FAFB] text-[#3056F5] text-xs font-medium rounded-md">
                +{job.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
            {job.applicant_count !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{job.applicant_count} applicants</span>
              </div>
            )}
          </div>

          {/* Job Level Badge */}
          <span className="px-2 py-1 bg-[#3056F5]/10 text-[#3056F5] text-xs font-semibold rounded-md">
            {job.level}
          </span>
        </div>
      </div>
    </div>
  );
});

JobCard.displayName = 'JobCard';
