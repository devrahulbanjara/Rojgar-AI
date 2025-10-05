import React, { memo } from 'react';
import { AnimatedContainer } from '../common/AnimatedContainer';

interface WelcomeMessageProps {
  firstName?: string;
  className?: string;
}

/**
 * Personalized welcome message component
 * Displays a clean welcome message with user's first name
 */
export const WelcomeMessage = memo<WelcomeMessageProps>(({
  firstName,
  className = '',
}) => {
  const displayName = firstName || 'there';
  
  return (
    <AnimatedContainer 
      className={`mb-6 ${className}`}
      direction="left"
      delay={0.1}
    >
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome back, <span className="text-primary">{displayName}</span>!
      </h1>
    </AnimatedContainer>
  );
});

WelcomeMessage.displayName = 'WelcomeMessage';