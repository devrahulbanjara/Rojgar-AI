/**
 * FilterChips Component
 * Quick filter chips for job search (Remote, Full-time, etc.)
 * Shows available filters for quick access and active filters with remove option
 */

import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type FilterType = 'remote' | 'full-time' | 'part-time' | 'contract' | 'hybrid'

interface FilterChipsProps {
  activeFilters: FilterType[]
  onFilterToggle: (filter: FilterType) => void
  onClearAll: () => void
  className?: string
  showAvailable?: boolean // Show all available filters, not just active ones
}

const filterLabels: Record<FilterType, string> = {
  remote: 'Remote',
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  hybrid: 'Hybrid',
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilters,
  onFilterToggle,
  onClearAll,
  className,
  showAvailable = false,
}) => {
  const allFilters: FilterType[] = ['remote', 'full-time', 'part-time', 'contract', 'hybrid']

  // If showAvailable is true, show all filters; otherwise only show active ones
  const filtersToShow = showAvailable ? allFilters : activeFilters

  if (filtersToShow.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
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
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-primary text-primary-foreground hover:bg-primary-700 border border-primary'
                : 'bg-background-surface text-text-tertiary hover:text-text-primary hover:bg-background-subtle border border-default hover:border-strong'
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
          className="text-sm text-text-tertiary hover:text-text-secondary font-medium transition-colors cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
