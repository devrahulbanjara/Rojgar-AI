/**
 * React Query Client Configuration
 * Centralized configuration for TanStack Query with localStorage persistence
 */

import { QueryClient } from '@tanstack/react-query';

// Cache key for localStorage
const CACHE_KEY = 'convexhire-query-cache';

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds that data remains fresh
      staleTime: 10 * 60 * 1000, // 10 minutes (increased for better caching)
      // Time in milliseconds that unused/inactive cache data remains in memory
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
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

/**
 * Persist cache to localStorage
 */
export function persistQueryCache() {
  if (typeof window === 'undefined') return;

  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  const cacheData: Record<string, { data: any; timestamp: number }> = {};

  queries.forEach((query) => {
    // Only cache successful queries with data
    if (query.state.status === 'success' && query.state.data) {
      const key = JSON.stringify(query.queryKey);
      cacheData[key] = {
        data: query.state.data,
        timestamp: Date.now(),
      };
    }
  });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    // localStorage might be full or disabled
    console.warn('Failed to persist query cache:', e);
  }
}

/**
 * Restore cache from localStorage
 */
export function restoreQueryCache() {
  if (typeof window === 'undefined') return;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;

    const cacheData: Record<string, { data: any; timestamp: number }> = JSON.parse(cached);
    const maxAge = 30 * 60 * 1000; // 30 minutes max cache age
    const now = Date.now();

    Object.entries(cacheData).forEach(([key, { data, timestamp }]) => {
      // Skip expired cache entries
      if (now - timestamp > maxAge) return;

      try {
        const queryKey = JSON.parse(key);
        queryClient.setQueryData(queryKey, data);
      } catch (e) {
        // Invalid cache entry
      }
    });
  } catch (e) {
    // Invalid cache data, clear it
    localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * Clear the persisted cache
 */
export function clearQueryCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
  queryClient.clear();
}

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
  // Job related queries
  jobs: {
    all: ['jobs'] as const,
    list: (page: number, limit: number) => ['jobs', 'list', page, limit] as const,
    recommendations: (userId: string, page: number, limit: number) =>
      ['jobs', 'recommendations', userId, page, limit] as const,
    search: (params: Record<string, any>) => ['jobs', 'search', params] as const,
    detail: (id: string) => ['jobs', id] as const,
  },
  // Application related queries
  applications: {
    all: ['applications'] as const,
    detail: (id: string) => ['applications', id] as const,
    byUser: (userId: string) => ['applications', 'user', userId] as const,
    byJob: (jobId: string) => ['applications', 'job', jobId] as const,
    trackingBoard: ['applications', 'tracking-board'] as const,
  },
  // Dashboard related queries
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    activity: ['dashboard', 'activity'] as const,
  },
} as const;
