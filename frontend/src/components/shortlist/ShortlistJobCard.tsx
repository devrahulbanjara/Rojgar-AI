import React from 'react'
import { Users, Zap, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAutoShortlist } from '../../hooks/useAutoShortlist'

interface ShortlistJobCardProps {
  job: {
    job_id: string
    title: string
    department?: string
    status: string
    shortlist_status: string
    applicant_count: number
    pending_reviews: number
    auto_shortlist?: boolean
  }
  isSelected: boolean
  onClick: () => void
  onAutoShortlistChange?: () => void
  className?: string
}

const getDepartmentBadgeStyle = (department: string) => {
  switch (department.toLowerCase()) {
    case 'design':
      return 'bg-ai-50/80 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 border border-ai-200 dark:border-ai-800'
    case 'engineering':
      return 'bg-primary-50/80 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
    case 'product':
      return 'bg-ai-50/80 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 border border-ai-200 dark:border-ai-800'
    default:
      return 'bg-background-subtle text-text-secondary border border-border-default'
  }
}

const getShortlistStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        label: 'Completed',
        className:
          'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800',
      }
    case 'in_progress':
      return {
        icon: Loader2,
        label: 'In Progress',
        className:
          'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
        iconClassName: 'animate-spin',
      }
    case 'failed':
      return {
        icon: AlertCircle,
        label: 'Failed',
        className:
          'bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800',
      }
    default:
      return {
        icon: Clock,
        label: 'Pending',
        className: 'bg-background-subtle text-text-tertiary border-border-default',
      }
  }
}

export function ShortlistJobCard({
  job,
  isSelected,
  onClick,
  onAutoShortlistChange,
  className,
}: ShortlistJobCardProps) {
  const {
    autoShortlist,
    isLoading: isLoadingAutoShortlist,
    toggle,
    isToggling,
  } = useAutoShortlist(job.job_id)

  const handleAutoShortlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoadingAutoShortlist || isToggling) return
    toggle()
    onAutoShortlistChange?.()
  }

  const shortlistStatus = getShortlistStatusBadge(job.shortlist_status)
  const StatusIcon = shortlistStatus.icon

  return (
    <div
      className={cn(
        'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-xl border p-6 relative',
        'hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800',
        isSelected
          ? 'border-primary-300 dark:border-primary-700 bg-gradient-to-br from-primary-50/50 to-primary-100/40 dark:from-primary-950/30 dark:to-primary-900/20 shadow-md shadow-primary/10'
          : 'border-border-default hover:shadow-lg',
        className
      )}
      style={{
        borderWidth: isSelected ? '2px' : '1px',
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header with department and auto-shortlist toggle */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {job.department && (
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                  getDepartmentBadgeStyle(job.department)
                )}
              >
                {job.department}
              </span>
            )}
            {/* Job status badge */}
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                job.status === 'expired'
                  ? 'bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800'
                  : 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800'
              )}
            >
              {job.status === 'expired' ? 'Expired' : 'Active'}
            </span>
          </div>

          <div className="relative group/tooltip">
            <button
              onClick={handleAutoShortlistToggle}
              disabled={isLoadingAutoShortlist || isToggling}
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
              <Zap className="w-4 h-4 transition-all duration-200" />
            </button>

            <div className="absolute top-full right-0 mt-2 px-2 py-1 text-xs text-text-inverse bg-text-primary rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {autoShortlist ? 'Auto Shortlist: ON' : 'Auto Shortlist: OFF'}
              <div className="absolute bottom-full right-2 border-4 border-transparent border-b-text-primary" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h3 className="font-semibold text-[19px] leading-tight text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer with stats */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-border-subtle">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50/80 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 rounded-lg border border-primary-200 dark:border-primary-800">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold">{job.applicant_count}</span>
          </div>

          {/* Shortlist status badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium',
              shortlistStatus.className
            )}
          >
            <StatusIcon className={cn('w-3.5 h-3.5', shortlistStatus.iconClassName)} />
            <span>{shortlistStatus.label}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
