/**
 * Enhanced Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ROUTES } from '../../config/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: log to Sentry, LogRocket, etc.
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = ROUTES.HOME;
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
          <Card className="w-full max-w-md text-center p-8 shadow-xl">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <CardTitle className="text-xl text-destructive">
                  Something went wrong
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try again or go back to the home page.
              </p>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Error Details:</h4>
                  <pre className="text-xs text-muted-foreground overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-muted-foreground overflow-auto mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
