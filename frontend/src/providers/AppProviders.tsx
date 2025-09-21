/**
 * Enhanced App Providers
 * Centralized provider setup with error boundaries and state management
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { queryClient } from '../state/queryClient';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import { theme } from '../design-system/theme';

// Error boundary fallback component
const ErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
    <div className="text-center space-y-6 max-w-md">
      <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-600">
          We're sorry, but something unexpected happened. Please try again.
        </p>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="text-left bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Error Details:</h3>
          <pre className="text-xs text-gray-700 overflow-auto">
            {error.message}
          </pre>
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={resetError}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

// Theme provider component
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Apply theme variables to CSS custom properties
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    Object.entries(theme.colors.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--color-secondary-${key}`, value);
    });
    
    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Apply typography variables
    root.style.setProperty('--font-family-sans', theme.typography.fontFamily.sans.join(', '));
    root.style.setProperty('--font-family-mono', theme.typography.fontFamily.mono.join(', '));
    
  }, []);
  
  return <>{children}</>;
};

// Main app providers component
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<ErrorFallback error={new Error('App Error')} resetError={() => window.location.reload()} />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            {children}
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
            
            {/* React Query DevTools (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Hook for accessing theme in components
export const useTheme = () => {
  return theme;
};

// Hook for accessing design system utilities
export const useDesignSystem = () => {
  return {
    theme,
    // Add utility functions here
    getColor: (color: string, shade: string = '500') => {
      const colorObj = (theme.colors as any)[color];
      return colorObj?.[shade] || color;
    },
    getSpacing: (size: string) => {
      return (theme.spacing as any)[size] || size;
    },
  };
};
