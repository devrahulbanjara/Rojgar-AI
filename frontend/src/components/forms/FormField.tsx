/**
 * Enhanced Form Field Component
 * Reusable form field with validation, error handling, and accessibility
 */

import React, { forwardRef } from 'react';
import { cn } from '../../design-system/components';
import { Label } from '../ui/label';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, hint, required, disabled, className, children }, ref) => {
    const fieldId = React.useId();
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium',
              error && 'text-destructive',
              disabled && 'text-muted-foreground'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            'aria-invalid': !!error,
            'aria-describedby': cn(
              error && errorId,
              hint && hintId
            ),
            disabled,
          } as any)}
        </div>
        
        {hint && !error && (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
