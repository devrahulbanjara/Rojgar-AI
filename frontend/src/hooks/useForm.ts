/**
 * Custom Form Hook
 * Reusable form state management with validation
 */

import { useState, useCallback } from 'react';
import type { UseFormReturn } from '../types';

interface UseFormOptions {
  initialValues?: Record<string, string>;
  validationRules?: Record<string, (value: string) => string | null>;
}

export const useForm = (options: UseFormOptions = {}): UseFormReturn => {
  const { initialValues = {}, validationRules = {} } = options;

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((name: string, value: string): string | null => {
    const rule = validationRules[name];
    return rule ? rule(value) : null;
  }, [validationRules]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(values).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  // Handle field change
  const handleChange = useCallback((name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (values: Record<string, string>) => Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error: any) {
        // Handle submission errors
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateForm]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field error manually
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && Object.keys(values).length > 0;

  return {
    values,
    errors,
    isSubmitting,
    isValid,
    handleChange,
    handleSubmit,
    reset,
    setFieldError,
  };
};
