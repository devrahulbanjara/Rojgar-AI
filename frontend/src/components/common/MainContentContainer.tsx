import React from 'react';
import { cn } from '../../lib/utils';

interface MainContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
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
  sm: 'px-4 py-4',
  md: 'px-6 py-6', 
  lg: 'px-8 py-8',
  xl: 'px-12 py-12'
};

export function MainContentContainer({ 
  children, 
  className,
  maxWidth = '7xl',
  padding = 'xl'
}: MainContentContainerProps) {
  return (
    <div 
      className={cn(
        'container mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        'max-lg:px-6 max-lg:py-6', // Responsive padding for mobile
        className
      )}
    >
      {children}
    </div>
  );
}
