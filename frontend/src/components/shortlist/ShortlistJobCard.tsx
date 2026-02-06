import React from 'react'
import { Users } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ShortlistJobCardProps {
  job: {
    job_id: string
    title: string
    department?: string
    applicant_count: number
    pending_ai_reviews: number
  }
  isSelected: boolean
  onClick: () => void
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

export function ShortlistJobCard({ job, isSelected, onClick, className }: ShortlistJobCardProps) {
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
        {/* Header Row: Department Badge */}
        <div className="flex items-start justify-between mb-5">
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
        </div>

        {/* Job Title */}
        <div className="mb-5">
          <h3 className="font-semibold text-[19px] leading-tight text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Stats Row */}
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
