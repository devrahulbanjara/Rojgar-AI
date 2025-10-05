import React, { memo } from 'react';
import { StatCard } from '../common/StatCard';
import { StaggerContainer } from '../common/AnimatedContainer';
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
      icon: <FileText className="h-5 w-5 text-primary" />,
      description: 'Total applications submitted',
    },
    {
      title: 'Interviews',
      value: stats.interviewsScheduled || 0,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      description: 'Scheduled interviews',
    },
    {
      title: 'Offers',
      value: 0, // This would come from stats in a real app
      icon: <Trophy className="h-5 w-5 text-primary" />,
      description: 'Job offers received',
    },
  ];

  const recruiterStats = [
    {
      title: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: <BriefcaseIcon className="h-5 w-5 text-primary" />,
      description: 'Jobs currently posted',
    },
    {
      title: 'Candidates',
      value: stats.totalApplications || 0, // Using totalApplications as candidate count
      icon: <Users className="h-5 w-5 text-primary" />,
      description: 'Active candidates',
    },
    {
      title: 'Interviews',
      value: stats.interviewsScheduled || 0,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      description: 'Scheduled this week',
    },
    {
      title: 'Hires',
      value: 0, // This would come from stats in a real app
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      description: 'Successful placements',
    },
  ];

  const statsToShow = userType === 'recruiter' ? recruiterStats : candidateStats;
  const gridCols = userType === 'recruiter' ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <StaggerContainer 
      className={`grid gap-6 ${gridCols} ${className}`}
      delay={0.1}
      staggerDelay={0.08}
    >
      {statsToShow.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
        />
      ))}
    </StaggerContainer>
  );
});

StatsGrid.displayName = 'StatsGrid';