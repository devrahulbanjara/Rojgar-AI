import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface JobSearchBarProps {
  value: string
  onChange: (value: string) => void
  onDebouncedChange?: (value: string) => void
  placeholder?: string
  className?: string
  loading?: boolean
  debounceMs?: number
}

export const JobSearchBar: React.FC<JobSearchBarProps> = ({
  value,
  onChange,
  onDebouncedChange,
  placeholder = 'Search by job title, company, or skills',
  className,
  loading = false,
  debounceMs = 400,
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (onDebouncedChange && value !== undefined) {
      debounceTimerRef.current = setTimeout(() => {
        onDebouncedChange(value)
      }, debounceMs)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value, debounceMs, onDebouncedChange])

  const handleClear = () => {
    onChange('')
    if (onDebouncedChange) {
      onDebouncedChange('')
    }
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear()
    } else if (e.key === 'Enter' && onDebouncedChange) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      onDebouncedChange(value)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative flex items-center bg-background-surface border transition-all duration-200 rounded-lg',
          isFocused
            ? 'border-primary ring-4 ring-primary/10 shadow-sm'
            : 'border-default hover:border-strong'
        )}
      >
        {}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {loading ? (
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          ) : (
            <Search
              className={cn(
                'w-5 h-5 transition-colors',
                isFocused ? 'text-primary' : 'text-text-muted'
              )}
            />
          )}
        </div>

        {}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search jobs, companies, or skills"
          className="w-full bg-transparent text-text-primary placeholder-text-muted text-[15px] focus:outline-none py-3 pl-[40px] pr-[44px]"
        />

        {}
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-background-subtle transition-colors cursor-pointer"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4 text-text-muted hover:text-text-secondary" />
          </button>
        )}
      </div>
    </div>
  )
}
