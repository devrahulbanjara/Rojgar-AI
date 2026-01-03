'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiClient } from '../lib/api';

export interface DashboardStats {
  totalApplications?: number;
  activeApplications?: number;
  interviewsScheduled?: number;
  offersReceived?: number;
  responseRate?: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get<DashboardStats>('/api/v1/applications/stats');

    // Handle both response formats: direct data or wrapped in ApiResponse
    if (response && typeof response === 'object') {
      // If it has the stats fields directly
      if ('totalApplications' in response || 'activeApplications' in response) {
        return response as DashboardStats;
      }
      // If it's wrapped in an ApiResponse structure
      if ('data' in response && response.data && typeof response.data === 'object') {
        return response.data as DashboardStats;
      }
    }

    return {
      totalApplications: 0,
      activeApplications: 0,
      interviewsScheduled: 0,
      offersReceived: 0,
      responseRate: 0,
    };
  } catch {
    // Return default stats on error instead of throwing
    return {
      totalApplications: 0,
      activeApplications: 0,
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
