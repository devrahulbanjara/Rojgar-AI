'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/** Single-choice pill filters (All · Open · Draft · Closed); the active chip is a black pill. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; count?: number }[]
  label: string
}) {
  return (
    <ToggleGroup
      type="single"
      spacing={1}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className="flex-wrap"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-8 rounded-full border bg-card px-3.5 text-sm font-medium text-foreground hover:bg-accent hover:text-foreground data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"
        >
          {option.label}
          {option.count !== undefined ? (
            <span className="text-xs tabular-nums opacity-60">{option.count}</span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
