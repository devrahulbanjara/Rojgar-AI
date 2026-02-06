'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({
  variant = 'default',
  className,
  showLabel = true,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const ThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    if (theme === 'system') return <Monitor className="h-4 w-4" />
    if (resolvedTheme === 'dark') return <Moon className="h-4 w-4" />
    return <Sun className="h-4 w-4" />
  }

  const themeLabel = !mounted
    ? 'Light'
    : theme === 'system'
      ? 'System'
      : resolvedTheme === 'dark'
        ? 'Dark'
        : 'Light'

  if (variant === 'icon-only') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          'p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-subtle transition-colors duration-200',
          className
        )}
        aria-label={`Switch theme (current: ${themeLabel})`}
        title={`Theme: ${themeLabel}`}
      >
        <ThemeIcon />
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-50/10 transition-all duration-200',
          className
        )}
        aria-label={`Switch theme (current: ${themeLabel})`}
        title={`Theme: ${themeLabel}`}
      >
        <ThemeIcon />
        {showLabel && <span className="text-xs">{themeLabel}</span>}
      </button>
    )
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-50/10 transition-all duration-200',
        className
      )}
      aria-label={`Switch theme (current: ${themeLabel})`}
      title={`Theme: ${themeLabel}`}
    >
      <div className="p-1.5 rounded-lg bg-background-subtle group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors duration-200">
        <ThemeIcon />
      </div>
      {showLabel && <span className="hidden lg:inline">{themeLabel}</span>}
    </button>
  )
}
