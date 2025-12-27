/**
 * SkeletonLoader Component
 * Provides smooth skeleton loading animations for various content types
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-muted rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'w-full',
    card: 'w-full h-32'
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <SkeletonLoader variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={3} />
    <div className="flex justify-between items-center">
      <SkeletonLoader variant="text" width="30%" />
      <SkeletonLoader variant="rectangular" width={80} height={32} />
    </div>
  </div>
);

export const SkeletonJobCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-start space-x-4">
      <SkeletonLoader variant="circular" width={48} height={48} />
      <div className="space-y-2 flex-1">
        <SkeletonLoader variant="text" width="70%" />
        <SkeletonLoader variant="text" width="50%" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={2} />
    <div className="flex flex-wrap gap-2">
      <SkeletonLoader variant="rectangular" width={60} height={24} />
      <SkeletonLoader variant="rectangular" width={80} height={24} />
      <SkeletonLoader variant="rectangular" width={70} height={24} />
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-6 space-y-4', className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="40%" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
      <SkeletonLoader variant="circular" width={40} height={40} />
    </div>
  </div>
);
