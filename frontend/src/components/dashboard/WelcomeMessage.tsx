import React, { memo } from 'react'

interface WelcomeMessageProps {
  firstName?: string
  organizationName?: string
  subtitle?: string
  className?: string
}

export const WelcomeMessage = memo<WelcomeMessageProps>(
  ({ firstName, organizationName, subtitle, className = '' }) => {
    const displayName = firstName || 'there'

    return (
      <div className={className}>
        <h1 className="text-[32px] max-lg:text-[28px] font-bold text-text-primary leading-tight tracking-tight">
          Welcome back,{' '}
          <span className="text-primary-600 dark:text-primary-400">{displayName}</span>
        </h1>
        {organizationName && (
          <p className="text-sm text-text-muted mt-1.5 font-medium">{organizationName}</p>
        )}
        {subtitle && <p className="text-base text-text-secondary mt-2">{subtitle}</p>}
      </div>
    )
  }
)

WelcomeMessage.displayName = 'WelcomeMessage'
