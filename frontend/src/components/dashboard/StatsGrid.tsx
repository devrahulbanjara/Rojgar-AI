import React, { memo } from 'react';
import { StatCard } from '../common/StatCard';
import { FileText, Calendar, Trophy, BriefcaseIcon, Users, TrendingUp, PieChart, Zap } from 'lucide-react';
import type { DashboardStats } from '../../hooks/useDashboardStats';

interface StatsGridProps {
  stats: DashboardStats;
  userType?: 'candidate' | 'recruiter';
  className?: string;
}

/**
 * Responsive stats grid component
 * Displays different stats based on user type (candidate vs recruiter)
 */
export const StatsGrid = memo<StatsGridProps>(({
  stats,
  userType = 'candidate',
  className = '',
}) => {
  const candidateStats = [
    {
      title: 'Applications',
      value: stats.totalApplications || 0,
      icon: <FileText />,
      description: 'Total applications submitted',
    },
    {
      title: 'Interviews',
      value: stats.interviewsScheduled || 0,
      icon: <Calendar />,
      description: 'Scheduled interviews',
    },
    {
      title: 'Offers',
      value: stats.offersReceived || 0,
      icon: <Trophy />,
      description: 'Job offers received',
    },
  ];

  /* 
   * Custom Recruiter Stats Layout 
   * Implementing the 4-card operational/strategic mix
   */
  if (userType === 'recruiter') {
    const recruiterStats = [
      {
        label: 'Active Job Postings',
        value: stats.activeApplications || 12, // activeApplications mapped to active jobs or using mock fallback
        icon: <BriefcaseIcon className="h-6 w-6" />,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        subtext: '3 closing this week',
        trendColor: 'text-blue-600' // Using matching color for subtext context
      },
      {
        label: 'Interviews This Week',
        value: stats.interviewsScheduled || 8, // Using real data or mock
        icon: <Calendar className="h-6 w-6" />,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        subtext: 'Next: Today, 2:00 PM',
        trendColor: 'text-purple-600'
      },
      {
        label: 'Top Hiring Department',
        value: 'Engineering', // text string as requested
        icon: <PieChart className="h-6 w-6" />,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        subtext: '45% of open roles',
        trendColor: 'text-orange-600'
      },
      {
        label: 'Avg. Time to Hire',
        value: '18 Days',
        icon: <Zap className="h-6 w-6" />,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        subtext: '↓ 2 days vs last month',
        trendColor: 'text-green-600'
      }
    ];

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {recruiterStats.map((stat, index) => {
          // Determine if value is a number or text for conditional styling
          const isNumeric = typeof stat.value === 'number';
          const valueClass = isNumeric
            ? 'text-3xl font-bold text-gray-900 leading-tight tracking-tight break-words'
            : 'text-xl font-bold text-gray-900 break-words leading-tight';

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex items-start h-full min-w-0"
            >
              {/* Icon Box - Fixed Size with top margin for alignment */}
              <div className={`flex-shrink-0 w-12 h-12 p-3 rounded-xl ${stat.bgColor} ${stat.textColor} flex items-center justify-center mt-1`}>
                {stat.icon}
              </div>

              {/* Content - Flexible with min-width constraint */}
              <div className="flex-1 min-w-0 ml-4">
                <p className={valueClass}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-500 mt-1 whitespace-normal leading-tight">
                  {stat.label}
                </p>
                <p className={`text-xs font-medium mt-2 ${stat.trendColor} opacity-90 whitespace-normal`}>
                  {stat.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback for Candidate (original layout)
  return (
    <div className={`grid gap-6 md:grid-cols-3 ${className}`}>
      {candidateStats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </div>
  );
});

StatsGrid.displayName = 'StatsGrid';
