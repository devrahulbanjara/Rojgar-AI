import React, { memo, useCallback } from 'react'
import { MapPin, DollarSign, Building2, Users, Clock, Briefcase, Eye, Calendar } from 'lucide-react'
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
    bg: 'bg-blue-50/80 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  Sales: {
    bg: 'bg-green-50/80 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  Marketing: {
    bg: 'bg-orange-50/80 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  Product: {
    bg: 'bg-purple-50/80 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  Design: {
    bg: 'bg-pink-50/80 dark:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  'Data Science': {
    bg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  HR: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  Finance: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  Operations: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
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
    bg: 'bg-blue-50/80 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  Junior: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  Lead: {
    bg: 'bg-violet-50/80 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  Principal: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  Entry: {
    bg: 'bg-teal-50/80 dark:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
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

  return (
    <div
      className={cn(
        'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-xl border p-6',
        'hover:-translate-y-1',
        isSelected
          ? 'border-primary shadow-lg bg-primary-50/5'
          : 'border-default hover:border-primary-200 dark:hover:border-primary-800',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${job.title} at ${job.company?.name || 'Company'}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="flex flex-col h-full">
        {}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            {job.department && (
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
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
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                  levelColor.bg,
                  levelColor.text,
                  levelColor.border
                )}
              >
                {job.level}
              </span>
            )}
          </div>
        </div>

        {}
        <div className="mb-5">
          <h3
            className={cn(
              'font-semibold text-[19px] leading-tight text-text-primary transition-colors line-clamp-2 mb-2',
              isSelected ? 'text-primary' : 'group-hover:text-primary'
            )}
          >
            {job.title}
          </h3>
          <p className="text-base text-text-secondary font-semibold">
            {job.company?.name ||
              (job as unknown as { organization?: { name?: string } }).organization?.name ||
              'Company'}
          </p>
        </div>

        {}
        <div className="space-y-2.5 text-sm text-text-secondary mb-6">
          {}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-[14px] h-[14px] text-text-muted" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-[14px] h-[14px] text-text-muted" />
              <span>{jobUtils.formatPostedDate(job.created_at || job.posted_date)}</span>
            </div>
          </div>

          {}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-[14px] h-[14px] text-text-muted" />
              <span className="font-medium">{jobUtils.formatJobSalary(job)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-[14px] h-[14px] text-text-muted" />
              <span>{job.employment_type}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-[14px] h-[14px] text-text-muted" />
              <span>{job.location_type || 'On-site'}</span>
            </div>
          </div>
        </div>

        {}
        <div className="flex-1" />

        {}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-subtle">
          <div className="flex items-center gap-3">
            {job.applicant_count !== undefined && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                <Users className="w-4 h-4" />
                <span className="text-xs font-semibold">{job.applicant_count}</span>
              </div>
            )}
            {job.views_count !== undefined && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-semibold">{job.views_count}</span>
              </div>
            )}
          </div>
          {job.application_deadline && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 rounded-lg border border-warning-200 dark:border-warning-800">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold">
                {formatDeadline(job.application_deadline)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

JobCard.displayName = 'JobCard'
