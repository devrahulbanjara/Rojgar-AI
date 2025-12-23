import React from 'react';
import { ApplicationTrackingColumn } from './ApplicationTrackingColumn';
import { EmptyState, LoadingSpinner } from '../common';
import type { Application } from '../../types/application';

interface ApplicationTrackingBoardProps {
  applications: {
    applied: Application[];
    interviewing: Application[];
    outcome: Application[];
  };
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const ApplicationTrackingBoard: React.FC<ApplicationTrackingBoardProps> = ({ 
  applications, 
  isLoading, 
  error, 
  onRetry 
}) => {
  const isEmpty = 
    applications.applied.length === 0 && 
    applications.interviewing.length === 0 && 
    applications.outcome.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
        title="Failed to load applications"
        description="There was an error loading your applications. Please try again."
        action={
          onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          )
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        }
        title="No applications yet"
        description="You haven't applied for any jobs yet. When you do, they'll appear here so you can track your progress."
      />
    );
  }

  return (
    <div className="w-full" role="region" aria-label="Application tracking board">
      {/* Mobile: Horizontal scroll */}
      <div className="block md:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 px-1" role="list" aria-label="Application columns">
          <div className="flex-shrink-0 w-80" role="listitem">
            <ApplicationTrackingColumn 
              title="Applied" 
              description="Applications submitted and under review"
              applications={applications.applied}
              columnType="applied"
            />
          </div>
          <div className="flex-shrink-0 w-80" role="listitem">
            <ApplicationTrackingColumn 
              title="Interviewing" 
              description="Active interview process"
              applications={applications.interviewing}
              columnType="interviewing"
            />
          </div>
          <div className="flex-shrink-0 w-80" role="listitem">
            <ApplicationTrackingColumn 
              title="Outcome" 
              description="Final results and decisions"
              applications={applications.outcome}
              columnType="outcome"
            />
          </div>
        </div>
      </div>

      {/* Desktop: Full width grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6" role="list" aria-label="Application columns">
        <div role="listitem">
          <ApplicationTrackingColumn 
            title="Applied" 
            description="Applications submitted and under review"
            applications={applications.applied}
            columnType="applied"
          />
        </div>
        <div role="listitem">
          <ApplicationTrackingColumn 
            title="Interviewing" 
            description="Active interview process"
            applications={applications.interviewing}
            columnType="interviewing"
          />
        </div>
        <div role="listitem">
          <ApplicationTrackingColumn 
            title="Outcome" 
            description="Final results and decisions"
            applications={applications.outcome}
            columnType="outcome"
          />
        </div>
      </div>
    </div>
  );
};