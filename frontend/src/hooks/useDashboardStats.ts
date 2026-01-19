'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiClient } from '../lib/api';

export interface DashboardStats {
  totalApplications?: number;
  activeApplications?: number;
  activeJobs?: number;
  interviewsScheduled?: number;
  offersReceived?: number;
  responseRate?: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch both application stats and active jobs count
    const [appStatsResponse, activeJobsResponse] = await Promise.all([
      apiClient.get<DashboardStats>('/api/v1/applications/stats').catch(() => null),
      apiClient.get<{ count: number }>('/api/v1/stats/active-jobs').catch(() => null),
    ]);

    // Handle application stats response
    let appStats: DashboardStats = {
      totalApplications: 0,
      activeApplications: 0,
      interviewsScheduled: 0,
      offersReceived: 0,
      responseRate: 0,
    };

    if (appStatsResponse && typeof appStatsResponse === 'object') {
      if ('totalApplications' in appStatsResponse || 'activeApplications' in appStatsResponse) {
        appStats = appStatsResponse as DashboardStats;
      } else if ('data' in appStatsResponse && appStatsResponse.data && typeof appStatsResponse.data === 'object') {
        appStats = appStatsResponse.data as DashboardStats;
      }
    }

    // Get active jobs count
    const activeJobs = activeJobsResponse?.count ?? 0;

    return {
      ...appStats,
      activeJobs,
    };
  } catch {
    // Return default stats on error instead of throwing
    return {
      totalApplications: 0,
      activeApplications: 0,
      activeJobs: 0,
      interviewsScheduled: 0,
      offersReceived: 0,
      responseRate: 0,
    };
  }
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2, // Retry failed requests
    retryDelay: 1000, // 1 second delay between retries
    refetchOnMount: true, // Always refetch on mount
  });
};
