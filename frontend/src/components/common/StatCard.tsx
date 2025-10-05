/**
 * StatCard Component
 * A reusable component for displaying statistics with icons and values
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
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

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
}) => {
  return (
    <Card className={cn("hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover-scale", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground animate-fade-in-left">{title}</h3>
            <p className="text-2xl font-bold animate-fade-in-up stagger-1" aria-label={`${title}: ${value}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground animate-fade-in-up stagger-2">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 animate-fade-in-up stagger-3">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                  aria-label={`${trend.isPositive ? 'Increase' : 'Decrease'} of ${trend.value}%`}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 animate-fade-in-right stagger-1" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
