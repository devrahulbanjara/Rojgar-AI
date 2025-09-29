/**
 * React Query Client Configuration
 * Centralized configuration for TanStack Query
 */

import { QueryClient } from '@tanstack/react-query';

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Time in milliseconds that unused/inactive cache data remains in memory
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Authentication related queries
  auth: {
    user: ['auth', 'user'] as const,
    login: ['auth', 'login'] as const,
    logout: ['auth', 'logout'] as const,
    signup: ['auth', 'signup'] as const,
  },
  // User related queries
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    profile: (id: string) => ['users', id, 'profile'] as const,
  },
  // Job related queries (for future use)
  jobs: {
    all: ['jobs'] as const,
    detail: (id: string) => ['jobs', id] as const,
    search: (params: Record<string, any>) => ['jobs', 'search', params] as const,
  },
  // Application related queries (for future use)
  applications: {
    all: ['applications'] as const,
    detail: (id: string) => ['applications', id] as const,
    byUser: (userId: string) => ['applications', 'user', userId] as const,
    byJob: (jobId: string) => ['applications', 'job', jobId] as const,
  },
} as const;
