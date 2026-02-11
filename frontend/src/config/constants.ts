export const APP_CONFIG = {
  name: 'ConvexHire',
  description: 'AI-Powered Recruitment Platform',
  version: '1.0.0',
} as const

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  version: 'v1',
  timeout: 10000,
} as const

export const API_BASE_URL = API_CONFIG.baseUrl

export const GOOGLE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your_google_client_id_here',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  scope: 'openid email profile',
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/signin',
  SIGNUP: '/signup',
  AUTH_CALLBACK: '/auth/callback',
  SELECT_ROLE: '/select-role',
  RECRUITER_DASHBOARD: '/recruiter/dashboard',
  CANDIDATE_DASHBOARD: '/candidate/dashboard',
  ORGANIZATION_DASHBOARD: '/organization/dashboard',
  RECRUITER: {
    DASHBOARD: '/recruiter/dashboard',
  },
  CANDIDATE: {
    DASHBOARD: '/candidate/dashboard',
    JOBS: '/candidate/jobs',
  },
  ORGANIZATION: {
    DASHBOARD: '/organization/dashboard',
    RECRUITERS: '/organization/recruiters',
    JOBS: '/organization/jobs',
    SETTINGS: '/organization/settings',
  },
} as const

export const USER_TYPES = {
  CANDIDATE: 'candidate',
  ORGANIZATION: 'organization',
} as const

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
} as const

export const ANIMATIONS = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.0,
} as const

export const LOADING_TIMES = {
  login: 1500,
  signup: 2000,
  default: 1000,
} as const

export const FEATURES = [
  'AI-powered job matching',
  'Real-time application tracking',
  'Automated scheduling',
  'Transparent feedback system',
] as const

export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
