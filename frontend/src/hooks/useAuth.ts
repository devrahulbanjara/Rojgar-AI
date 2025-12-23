/**
 * Authentication Hook (Refactored with React Query)
 * Manages user authentication state using React Query for better caching and state management
 */

'use client';

import type { LoginCredentials, SignupData, UseAuthReturn } from '../types';
import { useCurrentUser, useLogin, useSignup, useLogout, useIsAuthenticated } from './queries/useAuthQueries';

export const useAuth = (): UseAuthReturn => {
  const { data: user, refetch: refetchUser } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();

  // Login function
  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  // Signup function
  const signup = async (data: SignupData) => {
    await signupMutation.mutateAsync(data);
  };

  // Logout function
  const logout = () => {
    logoutMutation.mutate();
  };

  // Combined loading state from auth check and mutations
  const isLoading = authLoading || loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending;

  return {
    user: user || null,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refetchUser,
    // Expose mutation states for more granular control if needed
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    logoutError: logoutMutation.error,
    isLoginPending: loginMutation.isPending,
    isSignupPending: signupMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
};
