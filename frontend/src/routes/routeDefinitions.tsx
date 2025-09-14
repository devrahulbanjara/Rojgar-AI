/**
 * Route Definitions
 * Centralized route definitions with lazy loading for better performance
 */

import { lazy } from 'react';
import { ROUTES } from '@/config';

// Lazy load components for better performance
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Signup = lazy(() => import('@/pages/auth/Signup'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Recruiter pages
const RecruiterDashboard = lazy(() => import('@/pages/recruiter/Dashboard'));
const RecruiterJobs = lazy(() => import('@/pages/recruiter/Jobs'));
const RecruiterCandidates = lazy(() => import('@/pages/recruiter/Candidates'));
const RecruiterInterviews = lazy(() => import('@/pages/recruiter/Interviews'));
const RecruiterShortlist = lazy(() => import('@/pages/recruiter/Shortlist'));
const RecruiterFinalSelection = lazy(() => import('@/pages/recruiter/FinalSelection'));
const RecruiterCandidatePool = lazy(() => import('@/pages/recruiter/CandidatePool'));
const RecruiterCompanyProfile = lazy(() => import('@/pages/recruiter/CompanyProfile'));

// Candidate pages
const CandidateDashboard = lazy(() => import('@/pages/candidate/Dashboard'));
const CandidateBrowseJobs = lazy(() => import('@/pages/candidate/BrowseJobs'));
const CandidateMyApplications = lazy(() => import('@/pages/candidate/MyApplications'));
const CandidateResumes = lazy(() => import('@/pages/candidate/Resumes'));

// Layout components
const AppShell = lazy(() => import('@/components/layout/AppShell').then(module => ({ default: module.AppShell })));
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute').then(module => ({ default: module.ProtectedRoute })));

export const routeDefinitions = [
  // Public routes
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.SIGNUP,
    element: <Signup />,
  },
  
  // Recruiter routes
  {
    path: ROUTES.RECRUITER.DASHBOARD,
    element: (
      <ProtectedRoute requiredRole="recruiter">
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RecruiterDashboard />,
      },
      {
        path: 'jobs',
        element: <RecruiterJobs />,
      },
      {
        path: 'shortlist',
        element: <RecruiterShortlist />,
      },
      {
        path: 'interviews',
        element: <RecruiterInterviews />,
      },
      {
        path: 'final-selection',
        element: <RecruiterFinalSelection />,
      },
      {
        path: 'candidate-pool',
        element: <RecruiterCandidatePool />,
      },
      {
        path: 'company',
        element: <RecruiterCompanyProfile />,
      },
    ],
  },
  
  // Candidate routes
  {
    path: ROUTES.CANDIDATE.DASHBOARD,
    element: (
      <ProtectedRoute requiredRole="candidate">
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CandidateDashboard />,
      },
      {
        path: 'browse',
        element: <CandidateBrowseJobs />,
      },
      {
        path: 'applications',
        element: <CandidateMyApplications />,
      },
      {
        path: 'resumes',
        element: <CandidateResumes />,
      },
    ],
  },
  
  // Fallback route
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFound />,
  },
] as const;
