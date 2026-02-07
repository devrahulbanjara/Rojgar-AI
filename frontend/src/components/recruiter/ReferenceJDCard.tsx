import React from 'react'
import { FileText, Briefcase, ListChecks } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ReferenceJD } from '../../services/referenceJDService'

interface ReferenceJDCardProps {
  jd: ReferenceJD
  onClick?: () => void
  onUseTemplate?: (e: React.MouseEvent) => void
  className?: string
}

const departmentColors: Record<
  string,
  { bg: string; text: string; border: string; iconBg: string }
> = {
  Engineering: {
    bg: 'bg-primary-50/80 dark:bg-primary-950/30',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-800',
    iconBg: 'bg-primary-100 dark:bg-primary-900/50',
  },
  Sales: {
    bg: 'bg-success-50/80 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
    iconBg: 'bg-success-100 dark:bg-success-900/50',
  },
  Marketing: {
    bg: 'bg-warning-50/80 dark:bg-warning-950/30',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800',
    iconBg: 'bg-warning-100 dark:bg-warning-900/50',
  },
  Product: {
    bg: 'bg-ai-50/80 dark:bg-ai-950/30',
    text: 'text-ai-700 dark:text-ai-300',
    border: 'border-ai-200 dark:border-ai-800',
    iconBg: 'bg-ai-100 dark:bg-ai-900/50',
  },
  Design: {
    bg: 'bg-pink-50/80 dark:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50',
  },
  'Data Science': {
    bg: 'bg-info-50/80 dark:bg-info-950/30',
    text: 'text-info-700 dark:text-info-300',
    border: 'border-info-200 dark:border-info-800',
    iconBg: 'bg-info-100 dark:bg-info-900/50',
  },
  HR: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
  },
  Finance: {
    bg: 'bg-success-50/80 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-300',
    border: 'border-success-200 dark:border-success-800',
    iconBg: 'bg-success-100 dark:bg-success-900/50',
  },
  Operations: {
    bg: 'bg-warning-50/80 dark:bg-warning-950/30',
    text: 'text-warning-700 dark:text-warning-300',
    border: 'border-warning-200 dark:border-warning-800',
    iconBg: 'bg-warning-100 dark:bg-warning-900/50',
  },
  Default: {
    bg: 'bg-background-subtle/80',
    text: 'text-text-secondary',
    border: 'border-border-default',
    iconBg: 'bg-background-subtle',
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
        'group cursor-pointer transition-all duration-300 w-full bg-background-surface rounded-2xl border relative overflow-hidden',
        'p-6',
        'hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary-200 dark:hover:border-primary-800',
        'border-border-default',
        'shadow-sm hover:shadow-md',
        className
      )}
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
      {/* Subtle gradient overlay on hover - matches StatCard pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-50/20 dark:from-primary-950/0 dark:via-primary-950/0 dark:to-primary-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Content wrapper for z-index */}
      <div className="relative z-10">
        {/* Row 1: Department Badge - Single horizontal line */}
        <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
          {jd.department && (
            <span
              className={cn(
                'inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-semibold border whitespace-nowrap',
                deptColor.bg,
                deptColor.text,
                deptColor.border
              )}
            >
              {jd.department}
            </span>
          )}
          <span className="inline-flex items-center h-6 px-2.5 bg-ai-50 dark:bg-ai-950/30 text-ai-600 dark:text-ai-400 rounded-md text-[11px] font-medium border border-ai-200 dark:border-ai-800 whitespace-nowrap">
            Template
          </span>
        </div>

        {/* Row 2: Job Summary Preview */}
        {(jd.job_summary || jd.role_overview) && (
          <p className="mt-4 text-sm text-text-secondary leading-relaxed line-clamp-2">
            {jd.job_summary || jd.role_overview}
          </p>
        )}

        {/* Row 3: Stats - Single horizontal line with separators */}
        <div className="mt-4 flex items-center flex-nowrap overflow-hidden text-sm text-text-secondary">
          <Briefcase className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1.5 whitespace-nowrap">
            {jobResponsibilities.length} responsibilities
          </span>
          <span className="mx-2 text-text-muted/60 flex-shrink-0">·</span>
          <ListChecks className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="ml-1.5 whitespace-nowrap">
            {requiredQualifications.length} requirements
          </span>
        </div>

        {/* Row 4: Skills Tags - Single horizontal line */}
        {requiredQualifications.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            {/* Scrollable skills container */}
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              {requiredQualifications.slice(0, 2).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center h-6 px-2.5 text-[11px] font-medium text-text-secondary bg-background-subtle rounded-md border border-border-subtle whitespace-nowrap truncate max-w-[140px]"
                  title={skill}
                >
                  {skill.length > 20 ? `${skill.substring(0, 20)}...` : skill}
                </span>
              ))}
            </div>
            {/* "+X more" indicator - always visible, never compressed */}
            {requiredQualifications.length > 2 && (
              <span className="inline-flex items-center h-6 px-2.5 text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 rounded-md border border-primary-200 dark:border-primary-800 whitespace-nowrap flex-shrink-0">
                +{requiredQualifications.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Row 5: Use Template Button */}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <button
            onClick={onUseTemplate}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-md text-sm font-semibold leading-none transition-all duration-200 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-600 hover:text-white hover:border-primary-600 dark:hover:bg-primary-600 dark:hover:border-primary-600"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>Use Template</span>
          </button>
        </div>
      </div>
    </div>
  )
}
