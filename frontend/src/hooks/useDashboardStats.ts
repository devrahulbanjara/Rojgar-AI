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
    const [appStatsResponse, activeJobsResponse] = await Promise.all([
      apiClient.get<DashboardStats>('/api/v1/applications/stats').catch(() => null),
      apiClient.get<{ count: number }>('/api/v1/stats/active-jobs').catch(() => null),
    ]);

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

    const activeJobs = activeJobsResponse?.count ?? 0;

    return {
      ...appStats,
      activeJobs,
    };
  } catch {
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: true,
  });
};
