import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = 'default', size = 'md', error, children, ...props }, ref) => {
    const baseClasses = 'flex w-full rounded-md border bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat bg-[url(\'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364758b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E\')]';

    const variantClasses = {
      default: 'border-input',
      outline: 'border-2 border-input',
    };

    const sizeClasses = {
      sm: 'h-8 pl-2 pr-8 text-xs',
      md: 'h-10 pl-3 pr-10 text-sm',
      lg: 'h-12 pl-4 pr-12 text-base',
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
