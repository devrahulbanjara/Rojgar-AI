import React, { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner = memo<LoadingSpinnerProps>(({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-current border-t-transparent transition-all duration-300`}
        style={{
          animation: 'spin 1s linear infinite, pulse 2s ease-in-out infinite'
        }}
      />
      {message && (
        <span className="text-sm text-muted-foreground animate-fade-in-up">{message}</span>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
