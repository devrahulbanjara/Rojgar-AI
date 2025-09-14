/**
 * Application Constants
 * Centralized constants for better maintainability and consistency
 */

// Authentication constants
export const AUTH = {
  STORAGE_KEY: 'convexhire_auth',
  DEFAULT_PASSWORD: 'password123',
  DEMO_PASSWORD: 'demo',
} as const;

// Demo user credentials
export const DEMO_USERS = {
  recruiter: {
    email: 'recruiter@convexhire.com',
    password: AUTH.DEFAULT_PASSWORD,
    name: 'Rahul Dev Banjara',
  },
  candidate: {
    email: 'candidate@convexhire.com',
    password: AUTH.DEFAULT_PASSWORD,
    name: 'Diwas Adhikari',
  },
} as const;

// API configuration
export const API = {
  DELAY: 500, // milliseconds
  TIMEOUT: 10000, // milliseconds
} as const;

// Company size options
export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
] as const;

// Job-related constants
export const JOB = {
  LEVELS: ['Intern', 'Entry', 'Mid', 'Senior', 'Lead', 'Executive'] as const,
  LOCATION_TYPES: ['Remote', 'Hybrid', 'On-site'] as const,
  EMPLOYMENT_TYPES: ['Full-time', 'Part-time', 'Contract', 'Freelance'] as const,
  STATUSES: ['Draft', 'Active', 'Paused', 'Closed'] as const,
} as const;

// Application status options
export const APPLICATION_STATUSES = [
  'Applied',
  'In Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Extended',
  'Offer Accepted',
  'Hired',
  'Rejected',
  'Withdrawn',
] as const;

// UI constants
export const UI = {
  SIDEBAR_WIDTH: 256, // pixels
  TOPBAR_HEIGHT: 64, // pixels
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Form validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
} as const;
