/**
 * Application Constants
 * Centralized configuration for the ConvexHire application
 */

// Application Configuration
export const APP_CONFIG = {
  name: 'ConvexHire',
  description: 'AI-Powered Recruitment Platform',
  version: '1.0.0',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  version: 'v1',
  timeout: 10000, // 10 seconds
} as const;

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here',
  redirectUri: `${window.location.origin}/auth/callback`,
  scope: 'openid email profile',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  SELECT_ROLE: '/select-role',
  AUTH_CALLBACK: '/auth/callback',
  RECRUITER: {
    DASHBOARD: '/dashboard/recruiter',
  },
  CANDIDATE: {
    DASHBOARD: '/dashboard/candidate',
  },
} as const;

// User Types
export const USER_TYPES = {
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate',
} as const;

// Form Validation
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    minLength: 6,
    message: 'Password must be at least 6 characters long',
  },
  name: {
    minLength: 2,
    message: 'Name must be at least 2 characters long',
  },
} as const;

// Animation Durations
export const ANIMATIONS = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.0,
} as const;

// Loading States
export const LOADING_TIMES = {
  login: 1500,
  signup: 2000,
  default: 1000,
} as const;

// Feature Highlights (for landing page)
export const FEATURES = [
  'AI-powered job matching',
  'Real-time application tracking', 
  'Automated scheduling',
  'Transparent feedback system',
] as const;

// Environment
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;
