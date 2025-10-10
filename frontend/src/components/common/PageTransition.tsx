/**
 * PageTransition Component
 * Provides smooth page transitions for navigation
 */

import React, { useEffect, useState, memo } from 'react';
import { cn } from '../../lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PageTransition = memo<PageTransitionProps>(({
  children,
  className,
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'transition-all duration-200 cubic-bezier(0.6, 0, 0.2, 1)',
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
});

PageTransition.displayName = 'PageTransition';
