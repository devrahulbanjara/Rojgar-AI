/**
 * StatCard Component
 * Updated with new premium design system
 */

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
        "bg-white rounded-2xl p-8 border border-[#E5E7EB] transition-all duration-300 hover:scale-[1.01]",
        className
      )}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      {/* Icon Container */}
      {icon && (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(48, 86, 245, 0.08)' }}
        >
          {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
            className: 'h-6 w-6 text-[#3056F5]',
          })}
        </div>
      )}

      {/* Number */}
      <p className="text-[40px] max-lg:text-4xl font-bold text-[#0F172A] leading-none mb-2">
        {value}
      </p>

      {/* Label */}
      <p className="text-sm font-medium text-[#475569]">
        {description || title}
      </p>

      {/* Trend (optional) */}
      {trend && (
        <div className="flex items-center gap-1 mt-3">
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
            )}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-[#94A3B8]">vs last month</span>
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';
