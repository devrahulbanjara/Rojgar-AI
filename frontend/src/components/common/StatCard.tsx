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
        'group bg-background-surface rounded-2xl p-8 border border-border-default transition-all duration-300 hover:scale-[1.02] relative overflow-hidden shadow-sm',
        className
      )}
      onMouseEnter={e => {
        e.currentTarget.classList.add('shadow-lg')
        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.classList.remove('shadow-lg')
        e.currentTarget.style.borderColor = ''
      }}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-50/30 dark:from-primary-950/0 dark:via-primary-950/0 dark:to-primary-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {}
      {icon && (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 bg-primary/8">
          {React.isValidElement(icon) &&
            React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: 'h-6 w-6 text-primary',
            })}
        </div>
      )}

      {}
      <p className="text-[40px] max-lg:text-4xl font-bold text-text-primary leading-none mb-2 tracking-tight">
        {value}
      </p>

      {}
      <p className="text-sm font-medium text-text-secondary">{description || title}</p>
    </div>
  )
})

StatCard.displayName = 'StatCard'
