/**
 * Dashboard Stats Hook
 * Manages dashboard statistics for candidates and recruiters
 */

import { useState, useEffect } from 'react';

// Dashboard Stats Interface
export interface DashboardStats {
  totalApplications?: number;
  activeJobs?: number;
  interviewsScheduled?: number;
  responseRate?: number;
}

export interface UseDashboardStatsReturn {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeJobs: 0,
    interviewsScheduled: 0,
    responseRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      const mockStats: DashboardStats = {
        totalApplications: 3,
        activeJobs: 0, // This would be for recruiters
        interviewsScheduled: 1,
        responseRate: 75,
      };
      
      setStats(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};
