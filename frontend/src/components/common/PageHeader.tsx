import React from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <h1
            className={cn(
              'text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight',
              titleClassName
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={cn('text-base text-text-secondary', subtitleClassName)}>{subtitle}</p>
          )}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
      <div className="mt-6 border-b border-border-default/60" />
    </div>
  )
}
