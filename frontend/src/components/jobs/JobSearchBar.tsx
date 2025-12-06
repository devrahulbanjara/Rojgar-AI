/**
 * JobSearchBar Component
 * Updated with new design system
 */

import React, { useState, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface JobSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

export const JobSearchBar: React.FC<JobSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search jobs, companies, or skills...",
  className,
  loading = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'relative flex items-center bg-white border-[1.5px] rounded-xl transition-all duration-200',
        isFocused
          ? 'border-[#3056F5] ring-4 ring-[#3056F5]/10'
          : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
      )}>
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-[#94A3B8] animate-spin" />
          ) : (
            <Search className={cn(
              "w-5 h-5 transition-colors",
              isFocused ? "text-[#3056F5]" : "text-[#94A3B8]"
            )} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search jobs, companies, or skills"
          className="w-full h-11 pl-12 pr-12 bg-transparent text-[#0F172A] placeholder-[#94A3B8] text-[15px] focus:outline-none"
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-[#F9FAFB] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-[#94A3B8] hover:text-[#475569]" />
          </button>
        )}
      </div>
    </div>
  );
};
