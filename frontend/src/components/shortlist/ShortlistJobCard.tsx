import React from 'react'
import { Users, Zap, ChevronRight } from 'lucide-react'
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

  const statusDotColor =
    job.status === 'expired'
      ? 'bg-warning-500'
      : job.shortlist_status === 'completed'
        ? 'bg-success-500'
        : 'bg-primary-500'

  const statusLabel =
    job.shortlist_status === 'completed'
      ? 'Analyzed'
      : job.status === 'expired'
        ? 'Pending'
        : 'Active'

  return (
    <div
      className={cn(
        'relative p-3 rounded-xl cursor-pointer transition-all group text-left',
        isSelected
          ? 'bg-primary-50/60 dark:bg-primary-950/30'
          : 'hover:bg-background-subtle',
        className
      )}
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
      {isSelected && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary-600 dark:bg-primary-400 rounded-r-full" />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
          <div className={cn('h-2 w-2 rounded-full shrink-0', statusDotColor)} />
          <div className="truncate flex-1 min-w-0">
            <p
              className={cn(
                'text-[14px] font-bold truncate',
                isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-text-primary'
              )}
            >
              {job.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                <Users className="w-3 h-3" /> {job.applicant_count}
              </span>
              <span className="text-[11px] text-text-tertiary uppercase font-bold tracking-tighter">
                {statusLabel}
              </span>
              <button
                onClick={handleAutoShortlistToggle}
                disabled={isLoadingAutoShortlist || isToggling}
                className={cn(
                  'p-1 rounded-md transition-all',
                  autoShortlist
                    ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'text-text-muted hover:bg-background-subtle',
                  (isLoadingAutoShortlist || isToggling) && 'opacity-50 cursor-not-allowed'
                )}
                title={
                  autoShortlist
                    ? 'Auto Shortlist: ON - Click to disable'
                    : 'Auto Shortlist: OFF - Click to enable'
                }
              >
                <Zap className={cn('w-3 h-3', autoShortlist && 'fill-current')} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <ChevronRight
            className={cn(
              'w-4 h-4 text-text-muted transition-transform',
              isSelected ? 'translate-x-1 text-primary-400' : 'opacity-0 group-hover:opacity-100'
            )}
          />
        </div>
      </div>
    </div>
  )
}
