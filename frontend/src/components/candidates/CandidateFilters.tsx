import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface CandidateFiltersProps {
  activeFilters: string[]
  onFilterToggle: (filterId: string) => void
  onClearAll: () => void
  className?: string
  statusCounts?: {
    applied: number
    interviewing: number
    outcome: number
  }
}

const filterLabels: Record<string, string> = {
  applied: 'Applied',
  interviewing: 'Interviewing',
  outcome: 'Outcome',
}

const allFilters: string[] = ['applied', 'interviewing', 'outcome']

export function CandidateFilters({
  activeFilters,
  onFilterToggle,
  onClearAll,
  className,
  statusCounts: _statusCounts,
}: CandidateFiltersProps) {
  // Show all filters (like candidate jobs page with showAvailable)
  const filtersToShow = allFilters

  if (filtersToShow.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {activeFilters.length > 0 && (
        <span className="text-sm text-text-tertiary font-medium">Filters:</span>
      )}
      {filtersToShow.map(filter => {
        const isActive = activeFilters.includes(filter)

        return (
          <button
            key={filter}
            onClick={() => onFilterToggle(filter)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border',
              isActive
                ? 'bg-primary-600 text-text-inverse hover:bg-primary-700 border-primary-600 shadow-sm'
                : 'bg-background-surface text-text-tertiary hover:text-text-primary hover:bg-background-subtle border-border-default hover:border-border-strong'
            )}
            aria-label={
              isActive
                ? `Remove ${filterLabels[filter]} filter`
                : `Add ${filterLabels[filter]} filter`
            }
          >
            <span>{filterLabels[filter]}</span>
            {isActive && <X className="w-3.5 h-3.5" />}
          </button>
        )
      })}
      {activeFilters.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-sm text-text-tertiary hover:text-text-secondary font-medium transition-colors cursor-pointer px-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
