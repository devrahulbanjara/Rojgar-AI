import React, { memo } from 'react'
import { cn } from '../../lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export const StatCard = memo<StatCardProps>(({ title, value, icon, description, className }) => {
  return (
    <div
      className={cn(
        'group bg-background-surface rounded-2xl p-5 border border-border-default transition-all duration-300 hover:scale-[1.01] relative overflow-hidden shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800',
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-50/20 dark:from-primary-950/0 dark:via-primary-950/0 dark:to-primary-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Horizontal layout: Icon + Content */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Icon */}
        {icon && (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900">
            {React.isValidElement(icon) &&
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: 'h-6 w-6 text-primary-600 dark:text-primary-400',
              })}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <p className="text-3xl font-bold text-text-primary leading-none tracking-tight">
            {value}
          </p>
          {/* Description */}
          <p className="text-sm font-medium text-text-secondary mt-1 truncate">
            {description || title}
          </p>
        </div>
      </div>
    </div>
  )
})

StatCard.displayName = 'StatCard'
