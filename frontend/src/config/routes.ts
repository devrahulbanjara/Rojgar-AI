/**
 * Application Routes Configuration
 * Centralized route definitions for better maintainability
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  
  // Recruiter routes
  RECRUITER: {
    DASHBOARD: '/recruiter',
    JOBS: '/recruiter/jobs',
    SHORTLIST: '/recruiter/shortlist',
    INTERVIEWS: '/recruiter/interviews',
    FINAL_SELECTION: '/recruiter/final-selection',
    CANDIDATE_POOL: '/recruiter/candidate-pool',
    COMPANY: '/recruiter/company',
  },
  
  // Candidate routes
  CANDIDATE: {
    DASHBOARD: '/candidate',
    BROWSE: '/candidate/browse',
    APPLICATIONS: '/candidate/applications',
    RESUMES: '/candidate/resumes',
  },
  
  // Fallback
  NOT_FOUND: '*',
} as const;

// Route groups for easier navigation
export const ROUTE_GROUPS = {
  PUBLIC: [ROUTES.HOME, ROUTES.LOGIN, ROUTES.SIGNUP],
  RECRUITER: Object.values(ROUTES.RECRUITER),
  CANDIDATE: Object.values(ROUTES.CANDIDATE),
} as const;

// Route metadata for navigation and breadcrumbs
export const ROUTE_METADATA = {
  [ROUTES.HOME]: { title: 'Home', requiresAuth: false },
  [ROUTES.LOGIN]: { title: 'Login', requiresAuth: false },
  [ROUTES.SIGNUP]: { title: 'Sign Up', requiresAuth: false },
  [ROUTES.RECRUITER.DASHBOARD]: { title: 'Dashboard', requiresAuth: true, role: 'recruiter' },
  [ROUTES.RECRUITER.JOBS]: { title: 'Jobs', requiresAuth: true, role: 'recruiter' },
  [ROUTES.RECRUITER.SHORTLIST]: { title: 'Shortlist', requiresAuth: true, role: 'recruiter' },
  [ROUTES.RECRUITER.INTERVIEWS]: { title: 'Interviews', requiresAuth: true, role: 'recruiter' },
  [ROUTES.RECRUITER.FINAL_SELECTION]: { title: 'Final Selection', requiresAuth: true, role: 'recruiter' },
  [ROUTES.RECRUITER.CANDIDATE_POOL]: { title: 'Candidate Pool', requiresAuth: true, role: 'recruiter' },
  [ROUTES.RECRUITER.COMPANY]: { title: 'Company Profile', requiresAuth: true, role: 'recruiter' },
  [ROUTES.CANDIDATE.DASHBOARD]: { title: 'Dashboard', requiresAuth: true, role: 'candidate' },
  [ROUTES.CANDIDATE.BROWSE]: { title: 'Browse Jobs', requiresAuth: true, role: 'candidate' },
  [ROUTES.CANDIDATE.APPLICATIONS]: { title: 'My Applications', requiresAuth: true, role: 'candidate' },
  [ROUTES.CANDIDATE.RESUMES]: { title: 'Resumes', requiresAuth: true, role: 'candidate' },
} as const;
