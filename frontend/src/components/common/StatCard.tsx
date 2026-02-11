import React, { memo } from 'react'
import { cn } from '../../lib/utils'
import { Card, CardContent } from '../ui/card'

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
    <Card
      className={cn(
        'group overflow-hidden border-border-default hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 hover:shadow-md',
        className
      )}
    >
      <CardContent className="p-6 flex items-center gap-5">
        {/* Icon Container */}
        {icon && (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900">
            {React.isValidElement(icon) &&
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: 'h-6 w-6 text-primary-600 dark:text-primary-400',
              })}
          </div>
        )}

        {/* Text Content */}
        <div className="flex flex-col justify-center">
          <span className="text-3xl font-bold text-text-primary leading-none tracking-tight">
            {value}
          </span>
          <span className="text-sm font-medium text-text-tertiary mt-1.5 truncate">
            {description || title}
          </span>
        </div>
      </CardContent>
    </Card>
  )
})

StatCard.displayName = 'StatCard'
