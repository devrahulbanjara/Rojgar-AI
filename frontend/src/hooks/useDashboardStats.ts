/**
 * Dashboard Stats Hook
 * Manages dashboard statistics for candidates and recruiters
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';

// Dashboard Stats Interface
export interface DashboardStats {
  totalApplications?: number;
  activeJobs?: number;
  interviewsScheduled?: number;
  responseRate?: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Simulate API call - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - replace with actual API response
  return {
    totalApplications: 3,
    activeJobs: 0, // This would be for recruiters
    interviewsScheduled: 1,
    responseRate: 75,
  };
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    initialData: {
      totalApplications: 0,
      activeJobs: 0,
      interviewsScheduled: 0,
      responseRate: 0,
    },
  });
};
