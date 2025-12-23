/**
 * Client-side Providers
 * Wraps the app with necessary providers (React Query, etc.)
 * Includes localStorage cache persistence for faster page loads
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, persistQueryCache, restoreQueryCache, clearQueryCache } from '../lib/queryClient';
import { apiClient } from '../lib/api';
import { ROUTES } from '../config/constants';
import { ReactNode, useEffect } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Restore cache from localStorage on mount
    restoreQueryCache();

    // Set up global 401 handler for API client
    // This will clear cache and redirect to login when token expires
    apiClient.setUnauthorizedHandler(() => {
      // Clear React Query cache
      clearQueryCache();
      
      // Clear user data from React Query
      queryClient.setQueryData(['auth', 'user'], null);
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.LOGIN;
      }
    });

    // Persist cache to localStorage periodically and on unmount
    const persistInterval = setInterval(persistQueryCache, 60 * 1000); // Every 60 seconds

    // Also persist on page visibility change (when user leaves the page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistQueryCache();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Persist on beforeunload
    const handleBeforeUnload = () => {
      persistQueryCache();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(persistInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistQueryCache(); // Final persist on unmount
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
