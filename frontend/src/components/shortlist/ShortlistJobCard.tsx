import React from 'react'
import { Users, Clock } from 'lucide-react'
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
      return 'bg-pink-50/80 text-pink-700 border border-pink-200'
    case 'engineering':
      return 'bg-blue-50/80 text-blue-700 border border-blue-200'
    case 'product':
      return 'bg-purple-50/80 text-purple-700 border border-purple-200'
    default:
      return 'bg-gray-50/80 text-gray-700 border border-gray-200'
  }
}

export function ShortlistJobCard({
  job,
  isSelected,
  onClick,
  className,
}: ShortlistJobCardProps) {
  return (
    <div
      className={cn(
        'group cursor-pointer transition-all duration-300 w-full bg-white rounded-xl border p-6',
        'hover:-translate-y-1 hover:border-indigo-200',
        isSelected
          ? 'border-indigo-300 bg-indigo-50/30'
          : 'border-slate-200',
        className
      )}
      style={{
        boxShadow: isSelected 
          ? '0 4px 16px rgba(99, 102, 241, 0.15)' 
          : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = isSelected 
            ? '0 4px 16px rgba(99, 102, 241, 0.15)' 
            : '0 2px 8px rgba(0,0,0,0.08)'
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
          <h3 className="font-semibold text-[19px] leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Stats Row */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50/80 text-purple-700 rounded-lg border border-purple-200">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold">{job.applicant_count}</span>
          </div>

          {job.pending_ai_reviews > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50/80 text-amber-700 rounded-lg border border-amber-200">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">{job.pending_ai_reviews}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
