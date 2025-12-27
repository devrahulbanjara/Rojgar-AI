/**
 * Textarea Component
 * A styled textarea component
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', size = 'md', error, ...props }, ref) => {
    const baseClasses = 'flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    const variantClasses = {
      default: 'border-input',
      outline: 'border-2 border-input',
    };

    const sizeClasses = {
      sm: 'min-h-[60px] px-2 py-1 text-xs',
      md: 'min-h-[80px] px-3 py-2 text-sm',
      lg: 'min-h-[100px] px-4 py-3 text-base',
    };

    const errorClasses = error ? 'border-destructive focus:ring-destructive' : '';

    return (
      <textarea
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          errorClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
