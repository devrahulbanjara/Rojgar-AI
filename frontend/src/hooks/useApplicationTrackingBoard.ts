/**
 * Application Tracking Board Hook
 * Manages application tracking data for candidates
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { apiClient } from '../lib/api';
import type { ApplicationTrackingBoard } from '../types/application';

const fetchApplicationTrackingBoard = async (): Promise<ApplicationTrackingBoard> => {
  try {
    const response = await apiClient.get<ApplicationTrackingBoard>('/applications/tracking-board');
    
    // Handle both response formats: direct data or wrapped in ApiResponse
    // Backend returns data directly as { applied: [], interviewing: [], outcome: [] }
    if (response && typeof response === 'object') {
      // If it's already the tracking board structure
      if ('applied' in response && 'interviewing' in response && 'outcome' in response) {
        return response as any as ApplicationTrackingBoard;
      }
      // If it's wrapped in an ApiResponse structure
      if ('data' in response && response.data) {
        return response.data as ApplicationTrackingBoard;
      }
    }
    
    // Fallback to empty board
    console.warn('Unexpected response format from tracking board API:', response);
    return { applied: [], interviewing: [], outcome: [] };
  } catch (error) {
    console.error('Error fetching application tracking board:', error);
    throw error;
  }
};

export const useApplicationTrackingBoard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.applications.trackingBoard,
    queryFn: fetchApplicationTrackingBoard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  return {
    applicationTrackingData: data || { applied: [], interviewing: [], outcome: [] },
    isLoading,
    error,
    refetch,
  };
};
