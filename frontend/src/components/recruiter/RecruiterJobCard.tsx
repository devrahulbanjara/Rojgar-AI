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

    return (
      <div
        onClick={onClick}
        className={cn(
          'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-xl border p-6',
          'hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800',
          'border-border-default',
          'shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
          'hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
          className
        )}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
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
        <div className="flex flex-col h-full">
          {}
          <div className="flex items-start justify-between mb-5">
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

            {}
            <div className="relative group/tooltip">
              <button
                onClick={handleAutoShortlistToggle}
                disabled={isLoadingAutoShortlist || isToggling || !jobId}
                className={cn(
                  'flex items-center justify-center transition-all duration-200 rounded-full',
                  'hover:scale-110 active:scale-95',
                  autoShortlist
                    ? 'w-7 h-7 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 shadow-sm'
                    : 'w-5 h-5 text-text-muted hover:text-warning-500',
                  (isLoadingAutoShortlist || isToggling) && 'opacity-50 cursor-not-allowed'
                )}
                title={
                  autoShortlist
                    ? 'Auto Shortlist: ON - Click to disable'
                    : 'Auto Shortlist: OFF - Click to enable'
                }
              >
                <Zap
                  className={cn(
                    'transition-all duration-200',
                    autoShortlist ? 'w-4 h-4' : 'w-4 h-4'
                  )}
                />
              </button>

              {}
              <div className="absolute top-full right-0 mt-2 px-2 py-1 text-xs text-text-inverse bg-text-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {autoShortlist ? 'Auto Shortlist: ON' : 'Auto Shortlist: OFF'}
                <div className="absolute bottom-full right-2 border-4 border-transparent border-b-text-primary" />
              </div>
            </div>
          </div>

          {}
          <div className="mb-5">
            <h3 className="font-semibold text-[19px] leading-tight text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
          </div>

          {}
          <div className="space-y-2.5 text-sm text-text-tertiary mb-6">
            {}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-[14px] h-[14px] text-text-muted" />
                <span className="truncate">{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-[14px] h-[14px] text-text-muted" />
                <span>{formatPostedDate(job.posted_date || job.created_at)}</span>
              </div>
            </div>

            {}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-[14px] h-[14px] text-text-muted" />
                <span className="font-medium">{formatSalary(job)}</span>
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
          <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
            {}
            <div className="flex items-center gap-3">
              {job.applicant_count !== undefined && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-ai-50/80 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 rounded-lg border border-ai-200 dark:border-ai-800">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold">{job.applicant_count}</span>
                </div>
              )}
              {job.views_count !== undefined && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50/80 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 rounded-lg border border-primary-200 dark:border-primary-800">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-semibold">{job.views_count}</span>
                </div>
              )}
            </div>

            {}
            <div className="flex items-center">
              {job.application_deadline ? (
                displayStatus === 'Expired' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-error-50/80 dark:bg-error-950/30 text-error-700 dark:text-error-300 rounded-lg border border-error-200 dark:border-error-800">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold">Deadline: Expired</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-warning-50/80 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 rounded-lg border border-warning-200 dark:border-warning-800">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      {formatDeadline(job.application_deadline)}
                    </span>
                  </div>
                )
              ) : (
                onConvertToReferenceJD && (
                  <button
                    onClick={handleConvertClick}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      'text-primary-600 dark:text-primary-400 hover:text-text-inverse',
                      'border border-primary-200 hover:border-primary-600',
                      'hover:bg-primary-600',
                      'group-hover:shadow-sm'
                    )}
                    title="Save as Reference JD Template"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Save as Template</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

RecruiterJobCard.displayName = 'RecruiterJobCard'
