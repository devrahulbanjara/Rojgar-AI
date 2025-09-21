/**
 * Validation Utilities
 * Reusable validation functions for forms
 */

import { VALIDATION } from '../config/constants';

// Email validation
export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  if (!VALIDATION.email.pattern.test(email)) {
    return VALIDATION.email.message;
  }
  return undefined;
};

// Password validation
export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < VALIDATION.password.minLength) {
    return VALIDATION.password.message;
  }
  return undefined;
};

// Name validation
export const validateName = (name: string): string | undefined => {
  if (!name) {
    return 'Name is required';
  }
  if (name.length < VALIDATION.name.minLength) {
    return VALIDATION.name.message;
  }
  return undefined;
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return undefined;
};

// Required field validation
export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return undefined;
};
