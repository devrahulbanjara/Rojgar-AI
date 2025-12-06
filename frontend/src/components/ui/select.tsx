/**
 * Select Component
 * A styled select dropdown component
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = 'default', size = 'md', error, children, ...props }, ref) => {
    const baseClasses = 'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    const variantClasses = {
      default: 'border-input',
      outline: 'border-2 border-input',
    };

    const sizeClasses = {
      sm: 'h-8 px-2 text-xs',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    };

    const errorClasses = error ? 'border-destructive focus:ring-destructive' : '';

    return (
      <select
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          errorClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
