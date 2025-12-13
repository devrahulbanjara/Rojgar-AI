/**
 * Client-side Providers
 * Wraps the app with necessary providers (React Query, etc.)
 * Includes localStorage cache persistence for faster page loads
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, persistQueryCache, restoreQueryCache } from '../lib/queryClient';
import { ReactNode, useEffect } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Restore cache from localStorage on mount
    restoreQueryCache();

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
