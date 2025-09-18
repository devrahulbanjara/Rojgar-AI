/**
 * Authentication Query Hooks
 * React Query hooks for authentication-related API calls
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { LoginCredentials, SignupData, User, AuthResponse } from '../../types';
// import { authService } from '../../services/authService'; // TODO: Enable when backend is ready
import { queryKeys } from '../../lib/queryClient';
import { ROUTES, LOADING_TIMES, USER_TYPES } from '../../config/constants';
import { getDashboardRoute } from '../../utils/helpers';

// Get current user query
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<User | null> => {
      // TODO: Replace with actual API call when backend is ready
      // return await authService.getCurrentUser();
      
      // Mock implementation for demo
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      // Return mock user data if token exists
      return {
        id: '1',
        name: 'Demo User',
        email: 'demo@convexhire.com',
        userType: USER_TYPES.RECRUITER as 'recruiter',
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false, // Don't retry auth queries
  });
};

// Login mutation
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, LOADING_TIMES.login));
      
      // TODO: Replace with actual API call when backend is ready
      // return await authService.login(credentials);
      
      // Mock implementation for demo
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: credentials.email,
        userType: USER_TYPES.RECRUITER as 'recruiter',
      };

      const mockResponse: AuthResponse = {
        user: mockUser,
        token: 'mock-jwt-token',
      };

      // Store token in localStorage (temporary for demo)
      localStorage.setItem('auth_token', mockResponse.token);

      return mockResponse;
    },
    onSuccess: (data) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      
      // Redirect to dashboard
      const dashboardRoute = getDashboardRoute(data.user.userType);
      navigate(dashboardRoute);
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // Clear any existing auth data
      queryClient.setQueryData(queryKeys.auth.user, null);
      localStorage.removeItem('auth_token');
    },
  });
};

// Signup mutation
export const useSignup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SignupData): Promise<AuthResponse> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, LOADING_TIMES.signup));
      
      // TODO: Replace with actual API call when backend is ready
      // return await authService.signup(data);
      
      // Mock implementation for demo
      const mockUser: User = {
        id: '2',
        name: data.name,
        email: data.email,
        userType: data.userType,
      };

      const mockResponse: AuthResponse = {
        user: mockUser,
        token: 'mock-jwt-token',
      };

      // Store token in localStorage (temporary for demo)
      localStorage.setItem('auth_token', mockResponse.token);

      return mockResponse;
    },
    onSuccess: (data) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      
      // Redirect to appropriate dashboard
      const dashboardRoute = getDashboardRoute(data.user.userType);
      navigate(dashboardRoute);
    },
    onError: (error) => {
      console.error('Signup failed:', error);
      // Clear any existing auth data
      queryClient.setQueryData(queryKeys.auth.user, null);
      localStorage.removeItem('auth_token');
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // TODO: Replace with actual API call when backend is ready
      // await authService.logout();
      
      // Clear stored tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to home
      navigate(ROUTES.HOME);
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local data and redirect
      queryClient.clear();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      navigate(ROUTES.HOME);
    },
  });
};

// Check if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
};
