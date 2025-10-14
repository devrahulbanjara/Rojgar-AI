/**
 * Dashboard Stats Hook
 * Manages dashboard statistics for candidates and recruiters
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiClient } from '../lib/api';

// Dashboard Stats Interface
export interface DashboardStats {
  totalApplications?: number;
  activeApplications?: number; // Changed from activeJobs for candidates
  interviewsScheduled?: number;
  offersReceived?: number;
  responseRate?: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get<DashboardStats>('/applications/stats');
    
    // Handle both response formats: direct data or wrapped in ApiResponse
    if (response && typeof response === 'object') {
      // If it has the stats fields directly
      if ('totalApplications' in response || 'activeApplications' in response) {
        return response as any as DashboardStats;
      }
      // If it's wrapped in an ApiResponse structure
      if ('data' in response && response.data) {
        return response.data as DashboardStats;
      }
    }
    
    console.warn('Unexpected response format from stats API:', response);
    return {
      totalApplications: 0,
      activeApplications: 0,
      interviewsScheduled: 0,
      offersReceived: 0,
      responseRate: 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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
