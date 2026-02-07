import React, { memo, useCallback } from 'react'
import { MapPin, DollarSign, Users, Clock, Eye } from 'lucide-react'
import { cn } from '../../lib/utils'
import { jobUtils } from '../../services/jobService'
import type { Job } from '../../types/job'

interface JobCardProps {
  job: Job
  isSelected?: boolean
  onSelect?: (job: Job) => void
  onApply?: (job: Job) => void
  showApplyButton?: boolean
  className?: string
}

const departmentColors: Record<string, { bg: string; text: string; border: string }> = {
  Engineering: {
    bg: 'bg-primary-50/80 dark:bg-primary-950/30',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-800',
  },
  Sales: {
    bg: 'bg-success-50/80 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
  },
  Marketing: {
    bg: 'bg-warning-50/80 dark:bg-warning-950/30',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800',
  },
  Product: {
    bg: 'bg-info-50/80 dark:bg-info-950/30',
    text: 'text-info-700 dark:text-info-300',
    border: 'border-info-200 dark:border-info-800',
  },
  Design: {
    bg: 'bg-pink-50/80 dark:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  'Data Science': {
    bg: 'bg-info-50/80 dark:bg-info-950/30',
    text: 'text-info-700 dark:text-info-300',
    border: 'border-info-200 dark:border-info-800',
  },
  HR: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  Finance: {
    bg: 'bg-success-50/80 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
  },
  Operations: {
    bg: 'bg-warning-50/80 dark:bg-warning-950/30',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800',
  },
  Default: {
    bg: 'bg-background-subtle/80',
    text: 'text-text-secondary',
    border: 'border-border-default',
  },
}

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  Senior: {
    bg: 'bg-primary-50/80 dark:bg-primary-950/30',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-800',
  },
  Mid: {
    bg: 'bg-info-50/80 dark:bg-info-950/30',
    text: 'text-info-700 dark:text-info-300',
    border: 'border-info-200 dark:border-info-800',
  },
  Junior: {
    bg: 'bg-success-50/80 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
  },
  Lead: {
    bg: 'bg-primary-50/80 dark:bg-primary-950/30',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-800',
  },
  Principal: {
    bg: 'bg-warning-50/80 dark:bg-warning-950/30',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800',
  },
  Entry: {
    bg: 'bg-success-50/80 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
  },
  Default: {
    bg: 'bg-background-subtle/80',
    text: 'text-text-secondary',
    border: 'border-border-default',
  },
}

export const JobCard = memo<JobCardProps>(({ job, isSelected = false, onSelect, className }) => {
  const handleClick = useCallback(() => {
    onSelect?.(job)
  }, [onSelect, job])

  const deptColor = departmentColors[job.department || ''] || departmentColors.Default
  const levelColor = levelColors[job.level || ''] || levelColors.Default

  const formatDeadline = (deadline: string): string => {
    if (!deadline) return ''
    try {
      const deadlineDate = new Date(deadline)
      const now = new Date()
      const diffInMs = deadlineDate.getTime() - now.getTime()
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

      if (diffInDays < 0) {
        return 'Expired'
      } else if (diffInDays === 0) {
        return 'Today'
      } else if (diffInDays === 1) {
        return 'Tomorrow'
      } else if (diffInDays <= 7) {
        return `${diffInDays} days`
      } else {
        return deadlineDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      }
    } catch {
      return ''
    }
  }

  const hasFooterStats = job.applicant_count !== undefined || job.views_count !== undefined

  // Build location string from available fields
  const locationDisplay =
    job.location_city && job.location_country
      ? `${job.location_city}, ${job.location_country}`
      : job.location_city || job.location_country || job.location || 'Location not specified'

  const companyName =
    job.company?.name ||
    (job as unknown as { organization?: { name?: string } }).organization?.name ||
    'Company'

  return (
    <div
      className={cn(
        'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-2xl border relative overflow-hidden',
        'p-6',
        'hover:-translate-y-0.5 hover:scale-[1.01] shadow-sm hover:shadow-md',
        isSelected
          ? 'border-primary shadow-md bg-primary-50/5 dark:bg-primary-950/10'
          : 'border-border-default hover:border-primary-200 dark:hover:border-primary-800',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${job.title} at ${companyName}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Subtle gradient overlay on hover - matches StatCard pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-50/20 dark:from-primary-950/0 dark:via-primary-950/0 dark:to-primary-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Content wrapper for z-index */}
      <div className="relative z-10">
        {/* Row 1: Badges - Single horizontal line, no wrap */}
        <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
          {job.department && (
            <span
              className={cn(
                'inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-semibold border whitespace-nowrap',
                deptColor.bg,
                deptColor.text,
                deptColor.border
              )}
            >
              {job.department}
            </span>
          )}
          {job.level && (
            <span
              className={cn(
                'inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-semibold border whitespace-nowrap',
                levelColor.bg,
                levelColor.text,
                levelColor.border
              )}
            >
              {job.level}
            </span>
          )}
          {job.application_deadline && (
            <span className="inline-flex items-center h-6 px-2.5 bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 rounded-md text-[11px] font-semibold border border-warning-200 dark:border-warning-800 whitespace-nowrap">
              {formatDeadline(job.application_deadline)}
            </span>
          )}
        </div>

        {/* Row 2: Title */}
        <h3
          className={cn(
            'mt-4 font-semibold text-base leading-snug text-text-primary transition-colors duration-200 line-clamp-2',
            isSelected
              ? 'text-primary-600 dark:text-primary-400'
              : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
          )}
        >
          {job.title}
        </h3>

        {/* Row 3: Company */}
        <p className="mt-1.5 text-sm text-text-secondary font-medium">{companyName}</p>

        {/* Row 4: Metadata - Single horizontal line with separators, no wrap */}
        <div className="mt-4 flex items-center flex-nowrap overflow-hidden text-sm text-text-secondary">
          <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1.5 truncate max-w-[140px]">{locationDisplay}</span>
          <span className="mx-2 text-text-muted/60 flex-shrink-0">·</span>
          <DollarSign className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1 font-medium whitespace-nowrap">
            {jobUtils.formatJobSalary(job)}
          </span>
          <span className="mx-2 text-text-muted/60 flex-shrink-0">·</span>
          <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1.5 whitespace-nowrap">
            {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
          </span>
        </div>

        {/* Row 5: Work Type - Single horizontal line, no wrap */}
        <div className="mt-4 flex items-center gap-2 flex-nowrap">
          <span className="inline-flex items-center h-6 px-2.5 bg-background-subtle text-text-secondary rounded-md text-[11px] font-medium border border-border-subtle whitespace-nowrap">
            {job.employment_type}
          </span>
          <span className="inline-flex items-center h-6 px-2.5 bg-background-subtle text-text-secondary rounded-md text-[11px] font-medium border border-border-subtle whitespace-nowrap">
            {job.location_type || 'On-site'}
          </span>
        </div>

        {/* Row 6: Stats (Optional) - Single horizontal line */}
        {hasFooterStats && (
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-4 flex-nowrap">
            {job.applicant_count !== undefined && (
              <div className="inline-flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium">{job.applicant_count} applicants</span>
              </div>
            )}
            {job.views_count !== undefined && (
              <div className="inline-flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">{job.views_count} views</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

JobCard.displayName = 'JobCard'
