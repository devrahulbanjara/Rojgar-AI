/**
 * FilterChips Component
 * Quick filter chips for job search (Remote, Full-time, etc.)
 * Shows available filters for quick access and active filters with remove option
 */

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type FilterType = 'remote' | 'full-time' | 'part-time' | 'contract' | 'hybrid';

interface FilterChipsProps {
  activeFilters: FilterType[];
  onFilterToggle: (filter: FilterType) => void;
  onClearAll: () => void;
  className?: string;
  showAvailable?: boolean; // Show all available filters, not just active ones
}

const filterLabels: Record<FilterType, string> = {
  'remote': 'Remote',
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
  'hybrid': 'Hybrid',
};

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilters,
  onFilterToggle,
  onClearAll,
  className,
  showAvailable = false,
}) => {
  const allFilters: FilterType[] = ['remote', 'full-time', 'part-time', 'contract', 'hybrid'];

  // If showAvailable is true, show all filters; otherwise only show active ones
  const filtersToShow = showAvailable ? allFilters : activeFilters;

  if (filtersToShow.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {activeFilters.length > 0 && (
        <span className="text-sm text-[#64748B] font-medium">Filters:</span>
      )}
      {filtersToShow.map((filter) => {
        const isActive = activeFilters.includes(filter);

        return (
          <button
            key={filter}
            onClick={() => onFilterToggle(filter)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-[#3056F5] text-white hover:bg-[#2545D4] border border-[#3056F5]'
                : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#CBD5E1]'
            )}
            aria-label={isActive ? `Remove ${filterLabels[filter]} filter` : `Add ${filterLabels[filter]} filter`}
          >
            <span>{filterLabels[filter]}</span>
            {isActive && <X className="w-3.5 h-3.5" />}
          </button>
        );
      })}
      {activeFilters.length > 0 && (
        <button
          onClick={onClearAll}
          className="text-sm text-[#64748B] hover:text-[#475569] font-medium transition-colors cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

