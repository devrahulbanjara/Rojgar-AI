/**
 * Utility Functions
 * Common utility functions for the application
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"
import type { UserType } from '../types';
import { ROUTES, VALIDATION } from '../config/constants';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for Tailwind class deduplication
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date))
}

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Generate a random ID
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 */
export function generateId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "object") return Object.keys(value).length === 0
  return false
}

/**
 * Capitalize the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncate text to a specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated text
 */
export function truncate(text: string, length: number, suffix: string = "..."): string {
  if (text.length <= length) return text
  return text.slice(0, length) + suffix
}

// User-specific utilities
/**
 * Format user name for display
 * @param name - User name to format
 * @returns Formatted user name
 */
export const formatUserName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get dashboard route based on user type
 * @param userType - User type (recruiter or candidate)
 * @returns Dashboard route path
 */
export const getDashboardRoute = (userType: UserType): string => {
  return userType === 'recruiter' 
    ? ROUTES.RECRUITER.DASHBOARD 
    : ROUTES.CANDIDATE.DASHBOARD;
};

/**
 * Generate user initials
 * @param name - User name
 * @returns User initials (max 2 characters)
 */
export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Delay function for simulating API calls
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Validation utilities
/**
 * Email validation
 * @param email - Email to validate
 * @returns Error message or undefined if valid
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  
  if (!VALIDATION.email.pattern.test(email)) {
    return VALIDATION.email.message;
  }
  
  return undefined;
};

/**
 * Password validation
 * @param password - Password to validate
 * @returns Error message or undefined if valid
 */
export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < VALIDATION.password.minLength) {
    return VALIDATION.password.message;
  }
  
  return undefined;
};

/**
 * Name validation
 * @param name - Name to validate
 * @returns Error message or undefined if valid
 */
export const validateName = (name: string): string | undefined => {
  if (!name) {
    return 'Name is required';
  }
  
  if (name.length < VALIDATION.name.minLength) {
    return VALIDATION.name.message;
  }
  
  return undefined;
};

/**
 * Confirm password validation
 * @param confirmPassword - Confirmed password
 * @param password - Original password
 * @returns Error message or undefined if valid
 */
export const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  
  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }
  
  return undefined;
};

/**
 * Required field validation
 * @param value - Value to validate
 * @param fieldName - Name of the field
 * @returns Error message or undefined if valid
 */
export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  
  return undefined;
};

// Dynamic import utilities
/**
 * Create a dynamic import with loading component
 * @param importFn - Function that returns a dynamic import
 * @param fallback - Fallback component to show while loading
 * @returns Dynamic component
 */
export const createDynamicImport = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return React.lazy(importFn);
};

/**
 * Preload a component for better performance
 * @param importFn - Function that returns a dynamic import
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  importFn();
};
