import React, { memo } from 'react'

interface WelcomeMessageProps {
  firstName?: string
  organizationName?: string
  className?: string
}

/**
 * Personalized welcome message component
 * Updated with new design system
 */
export const WelcomeMessage = memo<WelcomeMessageProps>(
  ({ firstName, organizationName, className = '' }) => {
    const displayName = firstName || 'there'

    return (
      <div className={`mb-6 ${className}`}>
        <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight">
          Welcome back, <span className="text-[#3056F5]">{displayName}</span>!
        </h1>
        {organizationName && <p className="text-lg text-slate-600 mt-1.5">{organizationName}</p>}
      </div>
    )
  }
)

WelcomeMessage.displayName = 'WelcomeMessage'
