import React, { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Calendar, ArrowUpDown } from 'lucide-react'
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
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const hasActiveFilters =
    filters.scoreRange !== undefined ||
    filters.dateSort !== undefined ||
    filters.aiStatus !== undefined

  const getCurrentSortLabel = () => {
    const option = dateSortOptions.find(opt => opt.value === (filters.dateSort || 'newest'))
    return option?.label || 'Newest First'
  }

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
        {}
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

        {}
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

        {}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-tertiary">Sort:</span>
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsSortDropdownOpen(!isSortDropdownOpen)
                } else if (e.key === 'Escape') {
                  setIsSortDropdownOpen(false)
                }
              }}
              className={cn(
                'h-9 pl-3 pr-9 py-2 border rounded-xl bg-background-surface text-left focus:outline-none text-sm text-text-primary transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] min-w-[140px]',
                isSortDropdownOpen
                  ? 'border-ai-500 ring-2 ring-ai-500/20 shadow-md'
                  : 'border-border-default hover:border-ai-300 hover:bg-gradient-to-r hover:from-ai-50/30 hover:to-primary-50/30 hover:shadow-sm focus:border-ai-500 focus:ring-2 focus:ring-ai-500/20'
              )}
            >
              <div className="flex items-center gap-2 h-full">
                <ArrowUpDown className="w-4 h-4 text-ai-500" />
                <span className="font-medium text-text-primary">{getCurrentSortLabel()}</span>
              </div>
              <ChevronDown
                className={cn(
                  'absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200',
                  isSortDropdownOpen ? 'rotate-180 text-ai-600' : 'text-text-muted'
                )}
              />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-background-surface border border-ai-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 ring-1 ring-ai-100">
                {dateSortOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleFilterChange('dateSort', option.value)
                      setIsSortDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left hover:bg-gradient-to-r hover:from-ai-50 hover:to-primary-50 focus:bg-gradient-to-r focus:from-ai-50 focus:to-primary-50 focus:outline-none transition-all duration-200 flex items-center gap-2.5 text-sm text-text-primary hover:text-ai-700 transform hover:scale-[1.01] active:scale-[0.99] group',
                      (filters.dateSort === option.value ||
                        (option.value === 'newest' && !filters.dateSort)) &&
                        'bg-ai-50/50'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Calendar className="w-4 h-4 text-ai-500 transition-transform duration-200 group-hover:scale-110" />
                    <span className="font-medium">{option.label}</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <div className="w-2 h-2 bg-ai-500 rounded-full animate-pulse" />
                    </div>
                  </button>
                ))}
              </div>
            )}
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
