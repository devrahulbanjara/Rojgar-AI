/**
 * Helper Utilities
 * General utility functions used across the application
 */

import type { UserType } from '../types';
import { ROUTES } from '../config/constants';

// Format user name for display
export const formatUserName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get dashboard route based on user type
export const getDashboardRoute = (userType: UserType): string => {
  return userType === 'recruiter' 
    ? ROUTES.RECRUITER.DASHBOARD 
    : ROUTES.CANDIDATE.DASHBOARD;
};

// Format date for display
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Generate user initials
export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Delay function for simulating API calls
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Check if string is empty or whitespace
export const isEmpty = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

// Generate a simple ID (for demo purposes)
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
