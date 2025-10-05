import React from 'react';

interface WelcomeMessageProps {
  firstName?: string;
  className?: string;
}

/**
 * Personalized welcome message component
 * Displays a clean welcome message with user's first name
 */
export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  firstName,
  className = '',
}) => {
  const displayName = firstName || 'there';
  
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold text-slate-900 animate-fade-in-left">
        Welcome back, <span className="text-primary animate-fade-in-right stagger-1">{displayName}</span>!
      </h1>
    </div>
  );
};
