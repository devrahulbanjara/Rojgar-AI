/**
 * Navigation Hook
 * Custom hook for navigation-related functionality
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config';
import { useCallback } from 'react';

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToHome = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  const goToLogin = useCallback(() => {
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  const goToSignup = useCallback(() => {
    navigate(ROUTES.SIGNUP);
  }, [navigate]);

  const goToRecruiterDashboard = useCallback(() => {
    navigate(ROUTES.RECRUITER.DASHBOARD);
  }, [navigate]);

  const goToCandidateDashboard = useCallback(() => {
    navigate(ROUTES.CANDIDATE.DASHBOARD);
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isCurrentRoute = useCallback((route: string) => {
    return location.pathname === route;
  }, [location.pathname]);

  return {
    navigate,
    location,
    goToHome,
    goToLogin,
    goToSignup,
    goToRecruiterDashboard,
    goToCandidateDashboard,
    goBack,
    isCurrentRoute,
  };
}
