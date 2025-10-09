import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Reusable dashboard header component
 * Updated with new design system
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`mb-12 ${className}`}>
      <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base text-[#475569] mt-2 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
