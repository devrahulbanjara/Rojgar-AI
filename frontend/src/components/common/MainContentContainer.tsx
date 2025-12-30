import React from 'react';
import { cn } from '../../lib/utils';

interface MainContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

const paddingClasses = {
  none: 'py-8',
  sm: 'px-4 py-4 lg:px-4 lg:py-4',
  md: 'px-6 py-6 lg:px-6 lg:py-6',
  lg: 'px-6 py-8 lg:px-8 lg:py-8',
  xl: 'px-6 py-12 lg:px-8 lg:py-12'
};

export function MainContentContainer({
  children,
  className,
  maxWidth = '7xl',
  padding = 'lg'
}: MainContentContainerProps) {
  // When maxWidth is 'full', don't use container class to ensure equal spacing
  const containerClass = maxWidth === 'full' ? 'w-full' : 'container mx-auto';
  
  return (
    <div
      className={cn(
        containerClass,
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
