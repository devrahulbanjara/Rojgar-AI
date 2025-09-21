/**
 * React Query Client Configuration
 * Centralized query client setup with error handling and caching
 */

import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

// Default query options
const queryConfig: DefaultOptions = {
  queries: {
    // Cache time: 5 minutes
    staleTime: 5 * 60 * 1000,
    // Background refetch: 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus
    refetchOnWindowFocus: false,
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    // Show error toasts for mutations
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'An error occurred';
      toast.error(message);
    },
  },
};

// Create query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
    userProfile: (userId: string) => ['auth', 'userProfile', userId] as const,
  },
  
  // User queries
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, any>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  
  // Dashboard queries
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentActivity: ['dashboard', 'recentActivity'] as const,
  },
} as const;

// Utility functions for query invalidation
export const queryUtils = {
  // Invalidate all auth queries
  invalidateAuth: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
  },
  
  // Invalidate all user queries
  invalidateUsers: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  // Invalidate specific user
  invalidateUser: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
  },
  
  // Invalidate dashboard queries
  invalidateDashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentActivity });
  },
  
  // Clear all queries (useful for logout)
  clearAll: () => {
    queryClient.clear();
  },
  
  // Set query data
  setUserData: (user: any) => {
    queryClient.setQueryData(queryKeys.auth.currentUser, user);
  },
  
  // Remove query data
  removeUserData: () => {
    queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser });
  },
};
