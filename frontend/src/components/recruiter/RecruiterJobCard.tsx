import React, { memo } from 'react'
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Eye,
  BookmarkPlus,
  Building2,
  Calendar,
  Zap,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAutoShortlist } from '../../hooks/useAutoShortlist'
import { toast } from 'sonner'
import type { Job } from '../../types/job'

interface RecruiterJobCardProps {
  job: Job
  onClick?: () => void
  onConvertToReferenceJD?: () => void
  className?: string
}

function formatSalary(job: Job): string {
  const min = job.salary_range?.min ?? job.salary_min
  const max = job.salary_range?.max ?? job.salary_max
  const currency = job.salary_range?.currency ?? job.salary_currency ?? 'USD'

  if (!min && !max) return 'Competitive'

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${Math.round(num / 1000)}K`
    }
    return num.toString()
  }

  if (min && max) return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`
  if (min) return `${currency} From ${formatNumber(min)}`
  if (max) return `${currency} Up to ${formatNumber(max)}`
  return 'Competitive'
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return 'Recently'

  const date = new Date(dateStr)
  const now = new Date()

  if (isNaN(date.getTime())) return 'Recently'

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const postedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffTime = today.getTime() - postedDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}w ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months}mo ago`
  }
  const years = Math.floor(diffDays / 365)
  return `${years}y ago`
}

function formatDeadline(deadline: string): string {
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

export const RecruiterJobCard = memo<RecruiterJobCardProps>(
  ({ job, onClick, onConvertToReferenceJD, className }) => {
    const status = job.status || 'Draft'
    const displayStatus = status === 'Closed' ? 'Expired' : status
    const deptColor = departmentColors[job.department || ''] || departmentColors.Default

    const jobId = job.job_id || job.id?.toString() || null
    const {
      autoShortlist,
      isLoading: isLoadingAutoShortlist,
      toggle,
      isToggling,
    } = useAutoShortlist(jobId)

    // Build location string from available fields
    const locationDisplay = 
      job.location_city && job.location_country
        ? `${job.location_city}, ${job.location_country}`
        : job.location_city || job.location_country || job.location || 'Location not specified'

    const handleConvertClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onConvertToReferenceJD?.()
    }

    const handleAutoShortlistToggle = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!jobId || isLoadingAutoShortlist || isToggling) return

      toggle()

      setTimeout(() => {
        toast.success(
          autoShortlist
            ? `Auto Shortlist disabled for ${job.title}`
            : `Auto Shortlist enabled for ${job.title}`,
          { duration: 3000 }
        )
      }, 100)
    }

    const hasStats = job.applicant_count !== undefined || job.views_count !== undefined

    return (
      <div
        onClick={onClick}
        className={cn(
          'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-2xl border',
          'px-6 py-6',
          'hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-800',
          'border-border-default',
          'shadow-sm hover:shadow-lg',
          className
        )}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${job.title}`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        {/* Row 1: Badges + Auto Shortlist Toggle - Single horizontal line */}
        <div className="flex items-center justify-between gap-2 flex-nowrap">
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            {job.department && (
              <span
                className={cn(
                  'inline-flex items-center h-6 px-2.5 rounded text-[11px] font-semibold border whitespace-nowrap',
                  deptColor.bg,
                  deptColor.text,
                  deptColor.border
                )}
              >
                {job.department}
              </span>
            )}
            {job.application_deadline && (
              displayStatus === 'Expired' ? (
                <span className="inline-flex items-center h-6 px-2.5 bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-300 rounded text-[11px] font-semibold border border-error-200 dark:border-error-800 whitespace-nowrap">
                  Expired
                </span>
              ) : (
                <span className="inline-flex items-center h-6 px-2.5 bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 rounded text-[11px] font-semibold border border-warning-200 dark:border-warning-800 whitespace-nowrap">
                  {formatDeadline(job.application_deadline)}
                </span>
              )
            )}
          </div>

          {/* Auto Shortlist Toggle */}
          <div className="relative group/tooltip flex-shrink-0">
            <button
              onClick={handleAutoShortlistToggle}
              disabled={isLoadingAutoShortlist || isToggling || !jobId}
              className={cn(
                'flex items-center justify-center transition-all duration-200 rounded-full',
                'hover:scale-110 active:scale-95',
                autoShortlist
                  ? 'w-6 h-6 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400'
                  : 'w-5 h-5 text-text-muted hover:text-warning-500',
                (isLoadingAutoShortlist || isToggling) && 'opacity-50 cursor-not-allowed'
              )}
              title={autoShortlist ? 'Auto Shortlist: ON' : 'Auto Shortlist: OFF'}
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full right-0 mt-2 px-2 py-1 text-[10px] text-text-inverse bg-text-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {autoShortlist ? 'Auto Shortlist: ON' : 'Auto Shortlist: OFF'}
            </div>
          </div>
        </div>

        {/* Row 2: Title */}
        <h3 className="mt-5 font-semibold text-base leading-snug text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
          {job.title}
        </h3>

        {/* Row 3: Metadata - Single horizontal line with separators */}
        <div className="mt-4 flex items-center flex-nowrap overflow-hidden text-[13px] text-text-secondary">
          <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1 truncate max-w-[120px]">{locationDisplay}</span>
          <span className="mx-2 text-text-muted flex-shrink-0">·</span>
          <DollarSign className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-0.5 font-medium whitespace-nowrap">{formatSalary(job)}</span>
          <span className="mx-2 text-text-muted flex-shrink-0">·</span>
          <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1 whitespace-nowrap">{formatPostedDate(job.posted_date || job.created_at)}</span>
        </div>

        {/* Row 4: Work Type - Single horizontal line */}
        <div className="mt-4 flex items-center gap-2 flex-nowrap">
          <span className="inline-flex items-center h-6 px-2.5 bg-background-subtle text-text-secondary rounded text-[11px] font-medium border border-border-subtle whitespace-nowrap">
            {job.employment_type}
          </span>
          <span className="inline-flex items-center h-6 px-2.5 bg-background-subtle text-text-secondary rounded text-[11px] font-medium border border-border-subtle whitespace-nowrap">
            {job.location_type || 'On-site'}
          </span>
        </div>

        {/* Row 5: Stats + Actions - Single horizontal line */}
        {(hasStats || onConvertToReferenceJD) && (
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between gap-3 flex-nowrap">
            {/* Stats */}
            <div className="flex items-center gap-3 flex-nowrap">
              {job.applicant_count !== undefined && (
                <div className="inline-flex items-center gap-1 text-[11px] text-text-muted whitespace-nowrap">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium">{job.applicant_count} applicants</span>
                </div>
              )}
              {job.views_count !== undefined && (
                <div className="inline-flex items-center gap-1 text-[11px] text-text-muted whitespace-nowrap">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="font-medium">{job.views_count} views</span>
                </div>
              )}
            </div>

            {/* Save as Template button */}
            {onConvertToReferenceJD && !job.application_deadline && (
              <button
                onClick={handleConvertClick}
                className="flex items-center gap-1.5 h-7 px-3 rounded text-[11px] font-medium transition-all duration-200 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-600 hover:text-white hover:border-primary-600 whitespace-nowrap flex-shrink-0"
                title="Save as Reference JD Template"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Template</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)

RecruiterJobCard.displayName = 'RecruiterJobCard'
