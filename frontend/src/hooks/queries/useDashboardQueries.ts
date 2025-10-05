/**
 * Dashboard Query Hooks
 * React Query hooks for dashboard-related data fetching
 */

import { useQuery } from '@tanstack/react-query';
import type { DashboardData, DashboardStats, UserType } from '../../types';
import { queryKeys } from '../../lib/queryClient';
import { useCurrentUser } from './useAuthQueries';

// Get dashboard stats
export const useDashboardStats = (userType?: UserType) => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(userType || 'recruiter'),
    queryFn: async (): Promise<DashboardStats> => {
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiService.get(`/dashboard/stats?userType=${userType}`);
      // return response.data;
      
      // Mock implementation for demo
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      if (userType === 'recruiter') {
        return {
          totalApplications: 145,
          activeJobs: 12,
          interviewsScheduled: 8,
          responseRate: 78,
        };
      } else {
        return {
          totalApplications: 23,
          activeJobs: 5,
          interviewsScheduled: 3,
          responseRate: 85,
        };
      }
    },
    enabled: !!userType, // Only run if userType is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get dashboard activity
export const useDashboardActivity = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(userId || ''),
    queryFn: async (): Promise<any[]> => {
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiService.get(`/dashboard/activity/${userId}`);
      // return response.data;
      
      // Mock implementation for demo
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      return [
        {
          id: '1',
          type: 'application',
          message: 'New application received for Frontend Developer position',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'interview',
          message: 'Interview scheduled with John Doe',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'job',
          message: 'New job posting created: React Developer',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
    enabled: !!userId, // Only run if userId is provided
    staleTime: 2 * 60 * 1000, // 2 minutes (activity is more dynamic)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get complete dashboard data
export const useDashboardData = () => {
  const { data: user } = useCurrentUser();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(user?.userType);
  const { data: activity, isLoading: activityLoading, error: activityError } = useDashboardActivity(user?.id);

  return {
    dashboardData: user ? {
      user,
      stats: stats || {},
      recentActivity: activity || [],
    } as DashboardData : null,
    isLoading: statsLoading || activityLoading,
    error: statsError || activityError,
    user,
    stats,
    activity,
  };
};

// Prefetch dashboard data (useful for optimistic navigation)
export const usePrefetchDashboard = () => {
  const { data: user } = useCurrentUser();
  
  // This would be called when user hovers over dashboard link, etc.
  // queryClient.prefetchQuery({
  //   queryKey: queryKeys.dashboard.stats(user?.userType || 'recruiter'),
  //   queryFn: () => fetchDashboardStats(user?.userType),
  // });
  
  return { user };
};
