/**
 * Reusable form field component
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  multiline?: boolean;
  rows?: number;
  className?: string;
  hint?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  multiline = false,
  rows = 3,
  className,
  hint,
}: FormFieldProps) {
  const inputId = `field-${name}`;
  
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={inputId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        
        {multiline ? (
          <Textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(
              Icon && 'pl-10',
              error && 'border-destructive',
              'resize-none'
            )}
          />
        ) : (
          <Input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              Icon && 'pl-10',
              error && 'border-destructive'
            )}
          />
        )}
      </div>
      
      {hint && !error && (
        <p className="text-xs text-muted-foreground animate-fade-in">
          {hint}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-destructive animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}