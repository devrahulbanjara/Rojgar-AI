import React, { memo } from 'react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = memo<StatCardProps>(({
  title,
  value,
  icon,
  description,
  trend,
  className,
}) => {
  return (
    <div
      className={cn(
        "group bg-white rounded-2xl p-8 border border-[#E5E7EB] transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
        className
      )}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(48, 86, 245, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(48, 86, 245, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = '#E5E7EB';
      }}
    >
      {/* Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Icon Container */}
      {icon && (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: 'rgba(48, 86, 245, 0.08)' }}
        >
          {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: 'h-6 w-6 text-[#3056F5]',
          })}
        </div>
      )}

      {/* Number */}
      <p className="text-[40px] max-lg:text-4xl font-bold text-[#0F172A] leading-none mb-2 tracking-tight">
        {value}
      </p>

      {/* Label */}
      <p className="text-sm font-medium text-[#475569]">
        {description || title}
      </p>
    </div>
  );
});

StatCard.displayName = 'StatCard';
