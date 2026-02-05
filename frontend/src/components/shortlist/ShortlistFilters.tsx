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
  { value: 'high', label: 'High (80-100)', color: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium (60-79)', color: 'bg-amber-500' },
  { value: 'low', label: 'Low (40-59)', color: 'bg-red-500' },
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

  const handleFilterChange = (
    key: keyof ShortlistFilters,
    value: string
  ) => {
    onFiltersChange({
      ...filters,
      [key]:
        value === 'all'
          ? undefined
          : (value as 'high' | 'medium' | 'low' | 'newest' | 'oldest' | 'recommended' | 'not_recommended'),
    })
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="flex flex-wrap items-center gap-6">
        {/* Score Range Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#64748B]">Score:</span>
          <div className="flex gap-2">
            {scoreRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('scoreRange', option.value)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  filters.scoreRange === option.value || (option.value === 'all' && !filters.scoreRange)
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                )}
              >
                {option.color && (
                  <div className={cn('w-2 h-2 rounded-full', option.color)} />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Status Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#64748B]">Status:</span>
          <div className="flex gap-2">
            {aiStatusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('aiStatus', option.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  filters.aiStatus === option.value || (option.value === 'all' && !filters.aiStatus)
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Sort Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#64748B]">Sort:</span>
          <div className="relative">
            <select
              value={filters.dateSort || 'newest'}
              onChange={(e) => handleFilterChange('dateSort', e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              {dateSortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
