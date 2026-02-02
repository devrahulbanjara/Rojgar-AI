import { QueryClient } from '@tanstack/react-query';

const CACHE_KEY = 'convexhire-query-cache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const apiError = error as { status?: number };
        if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const apiError = error as { status?: number };
        if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});


export function persistQueryCache() {
  if (typeof window === 'undefined') return;

  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  const cacheData: Record<string, { data: unknown; timestamp: number }> = {};

  queries.forEach((query) => {
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
    console.warn('Failed to persist query cache:', e);
  }
}

export function restoreQueryCache() {
  if (typeof window === 'undefined') return;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;

    const cacheData: Record<string, { data: unknown; timestamp: number }> = JSON.parse(cached);
    const maxAge = 30 * 60 * 1000; // 30 minutes max cache age
    const now = Date.now();

    Object.entries(cacheData).forEach(([key, { data, timestamp }]) => {
      if (now - timestamp > maxAge) return;

      try {
        const queryKey = JSON.parse(key);
        queryClient.setQueryData(queryKey, data);
      } catch {
      }
    });
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function getCachedUserData() {
  if (typeof window === 'undefined') return undefined;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return undefined;

    const cacheData: Record<string, { data: unknown; timestamp: number }> = JSON.parse(cached);
    const userKey = JSON.stringify(['auth', 'user']);
    const userCache = cacheData[userKey];
    
    if (!userCache) return undefined;
    
    const maxAge = 30 * 60 * 1000; // 30 minutes max cache age
    if (Date.now() - userCache.timestamp > maxAge) return undefined;
    
    return userCache.data;
  } catch {
    return undefined;
  }
}

export function clearQueryCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
  queryClient.clear();
}

export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    login: ['auth', 'login'] as const,
    logout: ['auth', 'logout'] as const,
    signup: ['auth', 'signup'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    profile: (id: string) => ['users', id, 'profile'] as const,
  },
  jobs: {
    all: ['jobs'] as const,
    list: (page: number, limit: number) => ['jobs', 'list', page, limit] as const,
    recommendations: (userId: string, page: number, limit: number) =>
      ['jobs', 'recommendations', userId, page, limit] as const,
    search: (params: Record<string, unknown>) => ['jobs', 'search', params] as const,
    detail: (id: string) => ['jobs', id] as const,
  },
  applications: {
    all: ['applications'] as const,
    detail: (id: string) => ['applications', id] as const,
    byUser: (userId: string) => ['applications', 'user', userId] as const,
    byJob: (jobId: string) => ['applications', 'job', jobId] as const,
    trackingBoard: ['applications', 'tracking-board'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    activity: ['dashboard', 'activity'] as const,
  },
  organization: {
    recruiters: {
      all: ['organization', 'recruiters'] as const,
      detail: (id: string) => ['organization', 'recruiters', id] as const,
    },
  },
} as const;
