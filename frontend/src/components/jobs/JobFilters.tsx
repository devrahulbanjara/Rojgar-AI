/**
 * JobFilters Component
 * Provides search and filtering functionality for jobs
 */

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Filter, X, MapPin, Briefcase, DollarSign } from 'lucide-react';
import { cn } from '../../design-system/components';
import type { JobFiltersProps, JobFilters as JobFiltersType } from '../../types/job';

const LOCATION_OPTIONS = [
  { value: '', label: 'All Locations' },
  { value: 'Kathmandu', label: 'Kathmandu' },
  { value: 'Pokhara', label: 'Pokhara' },
  { value: 'Lalitpur', label: 'Lalitpur' },
  { value: 'Bhaktapur', label: 'Bhaktapur' },
  { value: 'Remote', label: 'Remote' },
];

const LOCATION_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'On-site', label: 'On-site' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Employment Types' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'All Levels' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid', label: 'Mid Level' },
  { value: 'Senior', label: 'Senior Level' },
  { value: 'Lead', label: 'Lead' },
  { value: 'Principal', label: 'Principal' },
];

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className,
  compact = false
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<JobFiltersType>(filters);

  const handleFilterChange = (key: keyof JobFiltersType, value: string | number | string[]) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: JobFiltersType = {};
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Compact Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={localFilters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="min-w-[140px]"
          >
            {LOCATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={localFilters.location_type?.[0] || ''}
            onChange={(e) => handleFilterChange('location_type', e.target.value ? [e.target.value] : [])}
            className="min-w-[120px]"
          >
            {LOCATION_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={localFilters.employment_type?.[0] || ''}
            onChange={(e) => handleFilterChange('employment_type', e.target.value ? [e.target.value] : [])}
            className="min-w-[140px]"
          >
            {EMPLOYMENT_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={localFilters.level?.[0] || ''}
            onChange={(e) => handleFilterChange('level', e.target.value ? [e.target.value] : [])}
            className="min-w-[120px]"
          >
            {LEVEL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {filters.search}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('search', '')}
                />
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {filters.location}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('location', '')}
                />
              </Badge>
            )}
            {filters.location_type && filters.location_type.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.location_type.join(', ')}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('location_type', [])}
                />
              </Badge>
            )}
            {filters.employment_type && filters.employment_type.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.employment_type.join(', ')}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('employment_type', [])}
                />
              </Badge>
            )}
            {filters.level && filters.level.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.level.join(', ')}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('level', [])}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search jobs, companies, or skills..."
          value={localFilters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={localFilters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="min-w-[140px]"
        >
          {LOCATION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={localFilters.location_type?.[0] || ''}
          onChange={(e) => handleFilterChange('location_type', e.target.value ? [e.target.value] : [])}
          className="min-w-[120px]"
        >
          {LOCATION_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={localFilters.employment_type?.[0] || ''}
          onChange={(e) => handleFilterChange('employment_type', e.target.value ? [e.target.value] : [])}
          className="min-w-[140px]"
        >
          {EMPLOYMENT_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          More Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Job Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Level
              </label>
              <Select
                value={localFilters.level?.[0] || ''}
                onChange={(e) => handleFilterChange('level', e.target.value ? [e.target.value] : [])}
              >
                {LEVEL_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Min Salary
              </label>
              <Input
                type="number"
                placeholder="Min salary"
                value={localFilters.salary_min || ''}
                onChange={(e) => handleFilterChange('salary_min', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Max Salary
              </label>
              <Input
                type="number"
                placeholder="Max salary"
                value={localFilters.salary_max || ''}
                onChange={(e) => handleFilterChange('salary_max', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {filters.search}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('search', '')}
                    />
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {filters.location}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('location', '')}
                    />
                  </Badge>
                )}
                {filters.location_type && filters.location_type.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.location_type.join(', ')}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('location_type', [])}
                    />
                  </Badge>
                )}
                {filters.employment_type && filters.employment_type.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.employment_type.join(', ')}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('employment_type', [])}
                    />
                  </Badge>
                )}
                {filters.level && filters.level.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.level.join(', ')}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange('level', [])}
                    />
                  </Badge>
                )}
                {filters.salary_min && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Min: {filters.salary_min}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('salary_min', undefined)}
                />
                  </Badge>
                )}
                {filters.salary_max && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Max: {filters.salary_max}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('salary_max', undefined)}
                />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
