import React, { memo } from 'react';
import { StatCard } from '../common/StatCard';
import { FileText, Calendar, Trophy, BriefcaseIcon, Users, TrendingUp } from 'lucide-react';
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

  const recruiterStats = [
    {
      title: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: <BriefcaseIcon />,
      description: 'Jobs currently posted',
    },
    {
      title: 'Candidates',
      value: stats.totalApplications || 0, // Using totalApplications as candidate count
      icon: <Users />,
      description: 'Active candidates',
    },
    {
      title: 'Interviews',
      value: stats.interviewsScheduled || 0,
      icon: <Calendar />,
      description: 'Scheduled this week',
    },
    {
      title: 'Hires',
      value: 0, // This would come from stats in a real app
      icon: <TrendingUp />,
      description: 'Successful placements',
    },
  ];

  const statsToShow = userType === 'recruiter' ? recruiterStats : candidateStats;
  const gridCols = userType === 'recruiter' ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <div className={`grid gap-6 ${gridCols} ${className}`}>
      {statsToShow.map((stat, index) => (
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
