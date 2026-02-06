import React from 'react'
import { Sparkles, CheckCircle2, Briefcase } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ReferenceJD } from '../../services/referenceJDService'

interface ReferenceJDCardProps {
  jd: ReferenceJD
  onClick?: () => void
  onUseTemplate?: (e: React.MouseEvent) => void
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

export function ReferenceJDCard({ jd, onClick, onUseTemplate, className }: ReferenceJDCardProps) {
  const deptColor = departmentColors[jd.department || ''] || departmentColors.Default

  const jobResponsibilities = jd.job_responsibilities || []
  const requiredQualifications = jd.required_qualifications || jd.requiredSkillsAndExperience || []

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-xl border p-8',
        'hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800',
        'border-border-default',
        'min-h-[340px]',
        'flex flex-col',
        'shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
        'hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
        className
      )}
      style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${jd.department} reference JD`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {}
      <div className="flex-1 flex flex-col">
        {}
        <div className="flex items-start justify-between mb-6">
          {jd.department && (
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                deptColor.bg,
                deptColor.text,
                deptColor.border
              )}
            >
              {jd.department}
            </span>
          )}
        </div>

        {}
        {requiredQualifications.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {requiredQualifications.slice(0, 2).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-text-secondary bg-background-subtle rounded-md"
                >
                  {skill.length > 30 ? `${skill.substring(0, 30)}...` : skill}
                </span>
              ))}
              {requiredQualifications.length > 2 && (
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/30 rounded-md">
                  +{requiredQualifications.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50/50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 rounded-lg">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium">
              {jobResponsibilities.length} Responsibilities
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-ai-50/50 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {requiredQualifications.length} Required Qualifications
            </span>
          </div>
        </div>

        {}
        <div className="flex-1" />

        {}
        <button
          onClick={onUseTemplate}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200',
            'text-primary-600 dark:text-primary-400 hover:text-text-inverse',
            'border border-primary-200 dark:border-primary-800 hover:border-primary-600',
            'hover:bg-primary-600',
            'group-hover:shadow-sm'
          )}
        >
          <Sparkles className="w-4 h-4" />
          Use Template
        </button>
      </div>
    </div>
  )
}
