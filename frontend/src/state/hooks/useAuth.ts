/**
 * Authentication State Management Hook
 * Centralized auth state with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { authService } from '../../services/authService';
import { queryKeys, queryUtils } from '../queryClient';
import type { LoginCredentials, SignupData, User } from '../../types';
import { ROUTES } from '../../config/constants';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user query
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      queryUtils.setUserData(data.user);
      toast.success('Welcome back!');
      
      // Navigate to appropriate dashboard
      const dashboardRoute = data.user.role === 'recruiter' 
        ? ROUTES.RECRUITER_DASHBOARD 
        : ROUTES.CANDIDATE_DASHBOARD;
      navigate(dashboardRoute);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Login failed';
      toast.error(message);
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (data: SignupData) => authService.signup(data),
    onSuccess: (data) => {
      queryUtils.setUserData(data.user);
      toast.success('Account created successfully!');
      
      // Navigate to appropriate dashboard
      const dashboardRoute = data.user.userType === 'recruiter' 
        ? ROUTES.RECRUITER_DASHBOARD 
        : ROUTES.CANDIDATE_DASHBOARD;
      navigate(dashboardRoute);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Signup failed';
      toast.error(message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryUtils.clearAll();
      toast.success('Logged out successfully');
      navigate(ROUTES.HOME);
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local state
      queryUtils.clearAll();
      toast.error('Logout failed, but you have been signed out locally');
      navigate(ROUTES.HOME);
    },
  });

  // Role selection mutation
  const selectRoleMutation = useMutation({
    mutationFn: (role: 'candidate' | 'recruiter') => authService.selectRole(role),
    onSuccess: (data) => {
      queryUtils.setUserData(data.user);
      toast.success(`Welcome as a ${role}!`);
      
      // Navigate to appropriate dashboard
      const dashboardRoute = role === 'recruiter' 
        ? ROUTES.RECRUITER_DASHBOARD 
        : ROUTES.CANDIDATE_DASHBOARD;
      navigate(dashboardRoute);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Role selection failed';
      toast.error(message);
    },
  });

  // Helper functions
  const login = (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  const signup = (data: SignupData) => {
    return signupMutation.mutateAsync(data);
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const selectRole = (role: 'candidate' | 'recruiter') => {
    return selectRoleMutation.mutateAsync(role);
  };

  const isAuthenticated = () => {
    return !!user && !userError;
  };

  const isRecruiter = () => {
    return user?.role === 'recruiter' || user?.userType === 'recruiter';
  };

  const isCandidate = () => {
    return user?.role === 'candidate' || user?.userType === 'candidate';
  };

  const getDashboardRoute = () => {
    if (isRecruiter()) return ROUTES.RECRUITER_DASHBOARD;
    if (isCandidate()) return ROUTES.CANDIDATE_DASHBOARD;
    return ROUTES.HOME;
  };

  return {
    // State
    user,
    isLoadingUser,
    userError,
    isAuthenticated: isAuthenticated(),
    
    // Mutations
    login,
    signup,
    logout,
    selectRole,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSelectingRole: selectRoleMutation.isPending,
    
    // Helper functions
    isRecruiter: isRecruiter(),
    isCandidate: isCandidate(),
    getDashboardRoute,
    
    // Error states
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    logoutError: logoutMutation.error,
    selectRoleError: selectRoleMutation.error,
  };
};
