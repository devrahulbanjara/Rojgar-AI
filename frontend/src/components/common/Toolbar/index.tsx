'use client'

import type { ChangeEvent, ReactNode } from 'react'

import { Search, X } from 'lucide-react'

import styles from './Toolbar.module.scss'

export function Toolbar({
  children,
  divider = true,
  className,
}: {
  children: ReactNode
  divider?: boolean
  className?: string
}) {
  const base = divider ? styles.toolbar : styles.toolbarPlain
  return <div className={[base, className].filter(Boolean).join(' ')}>{children}</div>
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  ariaLabel,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  ariaLabel?: string
}) {
  return (
    <div className={styles.search}>
      <span className={styles.searchIcon}>
        <Search size={16} aria-hidden="true" />
      </span>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-label={ariaLabel ?? placeholder}
      />
      {value ? (
        <button
          type="button"
          className={styles.searchClear}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  )
}

export type FilterOption<T extends string> = { value: T; label: string }

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T
  onChange: (next: T) => void
  options: ReadonlyArray<FilterOption<T>>
  ariaLabel: string
}) {
  return (
    <select
      className={styles.filterSelect}
      value={value}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T)}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function DateInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string
  onChange: (next: string) => void
  ariaLabel: string
}) {
  return (
    <input
      type="date"
      className={styles.dateInput}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      aria-label={ariaLabel}
    />
  )
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.resetBtn} onClick={onClick}>
      Reset
    </button>
  )
}

export function ToolbarCount({ children }: { children: ReactNode }) {
  return <span className={styles.count}>{children}</span>
}
