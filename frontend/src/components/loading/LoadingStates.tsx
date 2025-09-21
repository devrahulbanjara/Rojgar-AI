/**
 * Comprehensive Loading States Components
 * Reusable loading components for different scenarios
 */

import React from 'react';
import { Loader2, User, Building2, Briefcase, Users } from 'lucide-react';
import { cn } from '../../design-system/components';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'current';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary-foreground',
    white: 'text-white',
    current: 'text-current',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  description = 'Please wait while we fetch your data',
  icon,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <LoadingSpinner size="lg" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, lines = 1 }) => {
  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-muted rounded-md',
          className || 'h-4 w-full'
        )}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'animate-pulse bg-muted rounded-md',
            index === lines - 1 ? 'w-3/4' : 'w-full',
            className || 'h-4'
          )}
        />
      ))}
    </div>
  );
};

interface LoadingPageProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  title = 'Loading...',
  description = 'Please wait while we prepare your experience',
  icon,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        {icon && (
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              {icon}
            </div>
          </div>
        )}
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        </div>
      </div>
    </div>
  );
};

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  className,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" color="white" className="mr-2" />}
      {children}
    </button>
  );
};

// Specific loading components for different contexts
export const AuthLoading: React.FC = () => (
  <LoadingPage
    title="Authenticating..."
    description="Please wait while we verify your credentials"
    icon={<User className="h-8 w-8 text-primary" />}
  />
);

export const DashboardLoading: React.FC = () => (
  <LoadingPage
    title="Loading Dashboard..."
    description="Preparing your personalized dashboard"
    icon={<Briefcase className="h-8 w-8 text-primary" />}
  />
);

export const RecruiterLoading: React.FC = () => (
  <LoadingPage
    title="Loading Recruiter Dashboard..."
    description="Setting up your recruitment workspace"
    icon={<Building2 className="h-8 w-8 text-primary" />}
  />
);

export const CandidateLoading: React.FC = () => (
  <LoadingPage
    title="Loading Candidate Dashboard..."
    description="Preparing your job search experience"
    icon={<Users className="h-8 w-8 text-primary" />}
  />
);

// Loading overlay for modals/dialogs
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};
