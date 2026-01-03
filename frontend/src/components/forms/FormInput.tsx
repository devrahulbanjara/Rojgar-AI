/**
 * Form Input Component
 * Reusable form input with validation and icons
 */

import React, { useState, memo, useCallback } from 'react';
import { Input } from '../ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps {
  id: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  className?: string;
}

export const FormInput = memo<FormInputProps>(({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  icon: IconComponent,
  disabled = false,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {IconComponent && (
          <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-all duration-300">
            <IconComponent className="h-4 w-4" />
          </div>
        )}
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${IconComponent ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${
            error ? 'border-red-500' : ''
          } transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1) hover:scale-[1.01] focus:scale-[1.01]`}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1) hover:scale-105"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 animate-fade-in-down">{error}</p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';
