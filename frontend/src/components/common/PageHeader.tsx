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
    <div className={cn('space-y-2', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1
            className={cn(
              'text-4xl max-lg:text-3xl font-bold text-text-primary leading-tight',
              titleClassName
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={cn('text-base text-text-secondary mt-2', subtitleClassName)}>
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="ml-6 flex-shrink-0">{children}</div>}
      </div>
    </div>
  )
}
