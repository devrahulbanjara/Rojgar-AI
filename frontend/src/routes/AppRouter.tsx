/**
 * Application Router
 * Main router component with route definitions
 */

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/config';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load components
const LandingPage = React.lazy(() => import('@/pages/landing/LandingPage'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Signup = React.lazy(() => import('@/pages/auth/Signup'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Recruiter pages
const RecruiterDashboard = React.lazy(() => import('@/pages/recruiter/Dashboard'));
const RecruiterJobs = React.lazy(() => import('@/pages/recruiter/Jobs'));
const RecruiterShortlist = React.lazy(() => import('@/pages/recruiter/Shortlist'));
const RecruiterInterviews = React.lazy(() => import('@/pages/recruiter/Interviews'));
const RecruiterFinalSelection = React.lazy(() => import('@/pages/recruiter/FinalSelection'));
const RecruiterCandidatePool = React.lazy(() => import('@/pages/recruiter/CandidatePool'));
const RecruiterCompanyProfile = React.lazy(() => import('@/pages/recruiter/CompanyProfile'));

// Candidate pages
const CandidateDashboard = React.lazy(() => import('@/pages/candidate/Dashboard'));
const CandidateBrowseJobs = React.lazy(() => import('@/pages/candidate/BrowseJobs'));
const CandidateMyApplications = React.lazy(() => import('@/pages/candidate/MyApplications'));
const CandidateResumes = React.lazy(() => import('@/pages/candidate/Resumes'));

// Layout components
const AppShell = React.lazy(() => import('@/components/layout/AppShell').then(module => ({ default: module.AppShell })));
const ProtectedRoute = React.lazy(() => import('@/components/ProtectedRoute').then(module => ({ default: module.ProtectedRoute })));

// Loading fallback component
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Recruiter routes */}
        <Route 
          path="/recruiter" 
          element={
            <ProtectedRoute requiredRole="recruiter">
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<RecruiterDashboard />} />
          <Route path="jobs" element={<RecruiterJobs />} />
          <Route path="shortlist" element={<RecruiterShortlist />} />
          <Route path="interviews" element={<RecruiterInterviews />} />
          <Route path="final-selection" element={<RecruiterFinalSelection />} />
          <Route path="candidate-pool" element={<RecruiterCandidatePool />} />
          <Route path="company" element={<RecruiterCompanyProfile />} />
        </Route>
        
        {/* Candidate routes */}
        <Route 
          path="/candidate" 
          element={
            <ProtectedRoute requiredRole="candidate">
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<CandidateDashboard />} />
          <Route path="browse" element={<CandidateBrowseJobs />} />
          <Route path="applications" element={<CandidateMyApplications />} />
          <Route path="resumes" element={<CandidateResumes />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
