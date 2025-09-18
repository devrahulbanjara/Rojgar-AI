/**
 * Dashboard Hook (React Query powered)
 * Hook for dashboard-specific data and operations
 */

import { useDashboardData, useDashboardStats, useDashboardActivity } from './queries/useDashboardQueries';
import { useCurrentUser } from './queries/useAuthQueries';
// import type { DashboardData } from '../types'; // Type used in return type inference

export const useDashboard = () => {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { 
    dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    stats,
    activity 
  } = useDashboardData();

  return {
    // Main dashboard data
    dashboardData,
    user,
    stats,
    activity,
    
    // Loading states
    isLoading: userLoading || dashboardLoading,
    isUserLoading: userLoading,
    isDashboardLoading: dashboardLoading,
    
    // Error states
    error: dashboardError,
    
    // Helper flags
    hasData: !!dashboardData,
    hasStats: !!stats,
    hasActivity: !!activity && activity.length > 0,
  };
};

// Specific hook for just dashboard stats
export const useDashboardStatsOnly = () => {
  const { data: user } = useCurrentUser();
  const { data: stats, isLoading, error } = useDashboardStats(user?.userType);
  
  return {
    stats,
    isLoading,
    error,
    userType: user?.userType,
  };
};

// Specific hook for just dashboard activity
export const useDashboardActivityOnly = () => {
  const { data: user } = useCurrentUser();
  const { data: activity, isLoading, error } = useDashboardActivity(user?.id);
  
  return {
    activity,
    isLoading,
    error,
    userId: user?.id,
  };
};
