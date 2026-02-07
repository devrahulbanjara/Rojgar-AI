import React from 'react'
import { Users, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAutoShortlist } from '../../hooks/useAutoShortlist'

interface ShortlistJobCardProps {
  job: {
    job_id: string
    title: string
    department?: string
    applicant_count: number
    pending_ai_reviews: number
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

export function ShortlistJobCard({ job, isSelected, onClick, onAutoShortlistChange, className }: ShortlistJobCardProps) {
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
        {}
        <div className="flex items-start justify-between mb-5">
          {job.department ? (
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                getDepartmentBadgeStyle(job.department)
              )}
            >
              {job.department}
            </span>
          ) : (
            <div />
          )}

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

        {}
        <div className="mb-5">
          <h3 className="font-semibold text-[19px] leading-tight text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>

        {}
        <div className="flex-1" />

        {}
        <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-ai-50/80 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 rounded-lg border border-ai-200 dark:border-ai-800">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold">{job.applicant_count}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
