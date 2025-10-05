import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Reusable dashboard header component
 * Provides consistent styling for dashboard page headers
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold text-slate-900">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-600 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
};
