'use client'

import type { CSSProperties } from 'react'

type DashboardTabOption<T extends string> = {
  label: string
  value: T
  count?: number
}

type DashboardTabsProps<T extends string> = {
  options: DashboardTabOption<T>[]
  activeValue: T
  onChange: (value: T) => void
  className?: string
  style?: CSSProperties
}

export default function DashboardTabs<T extends string>({
  options,
  activeValue,
  onChange,
  className = '',
  style,
}: DashboardTabsProps<T>) {
  const classes = ['profile-tabs', className].filter(Boolean).join(' ')

  return (
    <div className={classes} style={style}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`profile-tabs__tab${activeValue === option.value ? ' profile-tabs__tab--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          {option.count && option.count > 0 ? (
            <span className="profile-tabs__count">{option.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
