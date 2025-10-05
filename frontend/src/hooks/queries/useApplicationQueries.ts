/**
 * Application Query Hooks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '../../config/constants';
import { queryKeys } from '../../lib/queryClient';
import type { ApplicationTrackingBoard } from '../../types/application';

export const useApplicationQueries = () => {
  const fetchApplicationTrackingBoard = async (): Promise<ApplicationTrackingBoard> => {
    const response = await fetch(`${API_CONFIG.baseUrl}/applications/tracking-board`, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  };

  const useApplicationTrackingBoard = () => {
    return useQuery({
      queryKey: queryKeys.applications.trackingBoard,
      queryFn: fetchApplicationTrackingBoard,
    });
  };

  return {
    useApplicationTrackingBoard,
  };
};
