/**
 * Validation Utilities
 * Reusable validation functions for forms
 */

import { VALIDATION } from '../config/constants';

// Email validation
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  if (!VALIDATION.email.pattern.test(email)) {
    return VALIDATION.email.message;
  }
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < VALIDATION.password.minLength) {
    return VALIDATION.password.message;
  }
  return null;
};

// Name validation
export const validateName = (name: string): string | null => {
  if (!name) {
    return 'Name is required';
  }
  if (name.length < VALIDATION.name.minLength) {
    return VALIDATION.name.message;
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

// Required field validation
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};
