/**
 * Authentication Hook
 * Custom hook for authentication-related functionality
 */

import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/config';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export function useAuth() {
  const authContext = useAuthContext();
  const navigate = useNavigate();

  const navigateToDashboard = useCallback((role: 'recruiter' | 'candidate') => {
    const targetRoute = role === 'recruiter' 
      ? ROUTES.RECRUITER.DASHBOARD 
      : ROUTES.CANDIDATE.DASHBOARD;
    navigate(targetRoute);
  }, [navigate]);

  const navigateToLogin = useCallback(() => {
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  const navigateToSignup = useCallback(() => {
    navigate(ROUTES.SIGNUP);
  }, [navigate]);

  return {
    ...authContext,
    navigateToDashboard,
    navigateToLogin,
    navigateToSignup,
  };
}
