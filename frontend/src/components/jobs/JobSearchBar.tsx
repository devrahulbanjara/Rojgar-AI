/**
 * JobSearchBar Component
 * LinkedIn-inspired search bar with enhanced UX
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../design-system/components';

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
        'relative flex items-center bg-background border border-border rounded-xl transition-all duration-300 ease-out',
        isFocused && 'border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]',
        'hover:border-border/80 hover:shadow-md'
      )}>
        {/* Search Icon */}
        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300">
          {loading ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className={cn(
              "w-4 h-4 text-muted-foreground transition-all duration-300",
              isFocused && "text-primary scale-110"
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
          className={cn(
            'w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-10 sm:pr-12 bg-transparent text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-0',
            'text-sm font-medium'
          )}
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-all duration-300 hover:scale-110"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors duration-300" />
          </button>
        )}
      </div>

      {/* Search Suggestions (Future Enhancement) */}
      {isFocused && value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 animate-slide-up">
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Search suggestions coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
