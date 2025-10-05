/**
 * Client-side Providers
 * Wraps the app with necessary providers (React Query, etc.)
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
