import React from 'react'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ShortlistFilters } from '../../types/shortlist'

interface ShortlistFiltersProps {
  filters: ShortlistFilters
  onFiltersChange: (filters: ShortlistFilters) => void
  onClearAll: () => void
}

const scoreRangeOptions = [
  { value: 'all', label: 'All Scores', color: null },
  { value: 'high', label: 'High (80-100)', color: 'bg-success-500' },
  { value: 'medium', label: 'Medium (60-79)', color: 'bg-warning-500' },
  { value: 'low', label: 'Low (40-59)', color: 'bg-error-500' },
]

const dateSortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
]

const aiStatusOptions = [
  { value: 'all', label: 'All Candidates' },
  { value: 'recommended', label: 'AI Recommended' },
  { value: 'not_recommended', label: 'Needs Review' },
]

export function ShortlistFiltersComponent({
  filters,
  onFiltersChange,
  onClearAll,
}: ShortlistFiltersProps) {
  const hasActiveFilters =
    filters.scoreRange !== undefined ||
    filters.dateSort !== undefined ||
    filters.aiStatus !== undefined

  const handleFilterChange = (key: keyof ShortlistFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]:
        value === 'all'
          ? undefined
          : (value as
              | 'high'
              | 'medium'
              | 'low'
              | 'newest'
              | 'oldest'
              | 'recommended'
              | 'not_recommended'),
    })
  }

  return (
    <div className="bg-background-surface rounded-2xl p-6 border border-border-default shadow-sm">
      <div className="flex flex-wrap items-center gap-6">
        {/* Score Range Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-tertiary">Score:</span>
          <div className="flex gap-2">
            {scoreRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('scoreRange', option.value)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  filters.scoreRange === option.value ||
                    (option.value === 'all' && !filters.scoreRange)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                    : 'bg-background-surface text-text-secondary hover:bg-background-subtle border border-border-default'
                )}
              >
                {option.color && <div className={cn('w-2 h-2 rounded-full', option.color)} />}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Status Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-tertiary">Status:</span>
          <div className="flex gap-2">
            {aiStatusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('aiStatus', option.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  filters.aiStatus === option.value || (option.value === 'all' && !filters.aiStatus)
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                    : 'bg-background-surface text-text-secondary hover:bg-background-subtle border border-border-default'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Sort Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-tertiary">Sort:</span>
          <div className="relative">
            <select
              value={filters.dateSort || 'newest'}
              onChange={e => handleFilterChange('dateSort', e.target.value)}
              className="appearance-none bg-background-surface border border-border-default rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              {dateSortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
