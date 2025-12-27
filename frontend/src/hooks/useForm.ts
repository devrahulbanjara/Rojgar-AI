/**
 * Enhanced Form Hook
 * Comprehensive form state management with validation
 */

'use client';

import { useState, useCallback, useRef } from 'react';

export interface ValidationRule<T = unknown> {
  (value: T, allValues?: Record<string, unknown>): string | undefined;
}

export interface FormConfig<T extends Record<string, unknown>> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormActions<T extends Record<string, unknown>> {
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearErrors: () => void;
  reset: () => void;
  handleChange: (field: string, value: unknown) => void;
  handleBlur: (field: string) => void;
  handleSubmit: (
    onSubmit?: (values: T) => void | Promise<void>
  ) => (e?: React.FormEvent) => Promise<void>;
  validate: () => boolean;
  validateField: (field: keyof T) => string | undefined;
}

export function useForm<T extends Record<string, unknown>>(
  config: FormConfig<T>
): [FormState<T>, FormActions<T>] {
  const {
    initialValues,
    validationRules = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = config;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);

  // Check if form is dirty
  const isDirty =
    JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);

  // Check if form is valid
  const isValid = Object.keys(validationRules || {}).every((field) => {
    const fieldRules = validationRules?.[field as keyof T];
    if (!fieldRules) return true;

    const fieldValue = values[field as keyof T];
    return fieldRules.every((rule: ValidationRule<T>) => !rule(fieldValue, values as Record<string, unknown>));
  });

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      const fieldRules = validationRules?.[field];
      if (!fieldRules) return undefined;

      const fieldValue = values[field] as T[keyof T];
      for (const rule of fieldRules) {
        const error = rule(fieldValue as T[keyof T], values as Record<string, unknown>);
        if (error) return error;
      }
      return undefined;
    },
    [values, validationRules]
  );

  // Validate all fields
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    if (validationRules) {
      Object.keys(validationRules).forEach((field) => {
        const fieldKey = field as keyof T;
        const error = validateField(fieldKey);
        if (error) {
          newErrors[fieldKey] = error;
          hasErrors = true;
        }
      });
    }

    setErrors(newErrors);
    return !hasErrors;
  }, [validateField, validationRules]);

  // Set a single value
  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Clear error when value changes
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Validate on change if enabled
      if (validateOnChange) {
        const error = validateField(field);
        if (error) {
          setErrors((prev) => ({ ...prev, [field]: error }));
        }
      }
    },
    [errors, validateField, validateOnChange]
  );

  // Set multiple values
  const setValuesAction = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Set a single error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  // Set multiple errors
  const setErrorsAction = useCallback(
    (newErrors: Partial<Record<keyof T, string>>) => {
      setErrors((prev) => ({ ...prev, ...newErrors }));
    },
    []
  );

  // Set touched state
  const setTouchedField = useCallback(
    (field: keyof T, touchedValue: boolean) => {
      setTouched((prev) => ({ ...prev, [field]: touchedValue }));
    },
    []
  );

  // Set field error (alias for setError)
  const setFieldError = useCallback(
    (field: keyof T, error: string) => {
      setError(field, error);
    },
    [setError]
  );

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Handle field change
  const handleChange = useCallback(
    (field: string, value: unknown) => {
      setValue(field as keyof T, value as T[keyof T]);
    },
    [setValue]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      if (validateOnBlur) {
        const error = validateField(field as keyof T);
        if (error) {
          setErrors((prev) => ({ ...prev, [field]: error }));
        }
      }
    },
    [validateField, validateOnBlur]
  );

  // Handle form submit
  const handleSubmit = useCallback(
    (customOnSubmit?: (values: T) => void | Promise<void>) => {
      return async (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        // Mark all fields as touched
        const allTouched = Object.keys(initialValues).reduce((acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        }, {} as Partial<Record<keyof T, boolean>>);
        setTouched(allTouched);

        // Validate form
        const isFormValid = validate();
        if (!isFormValid) {
          return;
        }

        setIsSubmitting(true);
        try {
          const submitHandler = customOnSubmit || onSubmit;
          if (submitHandler) {
            await submitHandler(values);
          }
        } catch {
          // Handle form submission error
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [values, validate, onSubmit, initialValues]
  );

  const state: FormState<T> = {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
  };

  const actions: FormActions<T> = {
    setValue,
    setValues: setValuesAction,
    setError,
    setErrors: setErrorsAction,
    setTouched: setTouchedField,
    setFieldError,
    clearFieldError,
    clearErrors,
    reset,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    validateField,
  };

  return [state, actions];
}
