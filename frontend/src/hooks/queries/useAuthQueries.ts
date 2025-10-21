/**
 * Authentication Query Hooks
 * React Query hooks for authentication-related API calls
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { LoginCredentials, SignupData, User, AuthResponse } from '../../types';
import { authService } from '../../services/authService';
import { queryKeys } from '../../lib/queryClient';
import { ROUTES } from '../../config/constants';
import { getDashboardRoute } from '../../lib/utils';

// Get current user query
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<User | null> => {
      try {
        const user = await authService.getCurrentUser();
        
        if (user) {
          // Convert backend user format to frontend format
          return {
            ...user,
            id: user.id.toString(),
            userType: user.role,
          };
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: false, // Don't retry auth queries
  });
};

// Login mutation
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return await authService.login(credentials);
    },
    onSuccess: (data) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      
      // Redirect to dashboard
      const userType = data.user.userType || data.user.role;
      if (userType) {
        const dashboardRoute = getDashboardRoute(userType);
        router.push(dashboardRoute);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      // Clear any existing auth data
      queryClient.setQueryData(queryKeys.auth.user, null);
    },
  });
};

// Signup mutation
export const useSignup = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SignupData): Promise<AuthResponse> => {
      return await authService.signup(data);
    },
    onSuccess: (data) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user);
      
      // Redirect to appropriate dashboard
      const userType = data.user.userType || data.user.role;
      if (userType) {
        const dashboardRoute = getDashboardRoute(userType);
        router.push(dashboardRoute);
      }
    },
    onError: (error) => {
      console.error('Signup failed:', error);
      // Clear any existing auth data
      queryClient.setQueryData(queryKeys.auth.user, null);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await authService.logout();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to home
      router.push(ROUTES.HOME);
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local data and redirect
      queryClient.clear();
      router.push(ROUTES.HOME);
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
