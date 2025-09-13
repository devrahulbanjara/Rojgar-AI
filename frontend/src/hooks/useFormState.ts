/**
 * Custom hook for managing form state
 */

import { useState, useCallback, ChangeEvent } from 'react';

interface UseFormStateOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
  validation?: Partial<Record<keyof T, (value: any) => string | undefined>>;
}

export function useFormState<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validation,
}: UseFormStateOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle input change
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkboxes
    const finalValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    setValues(prev => ({
      ...prev,
      [name]: finalValue,
    }));
    
    // Clear error for this field
    if (errors[name as keyof T]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof T];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Set a specific field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Validate all fields
  const validate = useCallback((): boolean => {
    if (!validation) return true;
    
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;
    
    for (const [field, validator] of Object.entries(validation)) {
      const error = validator(values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [values, validation]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validate()) {
      return;
    }
    
    if (!onSubmit) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, validate]);
  
  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);
  
  // Get field props for an input
  const getFieldProps = useCallback((name: keyof T) => ({
    name: name as string,
    value: values[name] || '',
    onChange: handleChange,
    error: errors[name],
  }), [values, errors, handleChange]);
  
  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    setFieldValue,
    handleSubmit,
    reset,
    getFieldProps,
    setValues,
  };
}