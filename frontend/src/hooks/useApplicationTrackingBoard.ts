'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { apiClient } from '../lib/api'
import type { ApplicationTrackingBoard } from '../types/application'

const fetchApplicationTrackingBoard = async (): Promise<ApplicationTrackingBoard> => {
  // Note: This endpoint may need to be created in backend at /api/v1/recruiter/applications/tracking-board
  // For now, using candidate applications endpoint as fallback
  const response = await apiClient
    .get<ApplicationTrackingBoard>('/api/v1/candidate/applications/tracking-board')
    .catch(() => null)

  if (!response) {
    return { applied: [], interviewing: [], outcome: [] }
  }

  if (response && typeof response === 'object') {
    if ('applied' in response && 'interviewing' in response && 'outcome' in response) {
      return response as ApplicationTrackingBoard
    }
  }

  return { applied: [], interviewing: [], outcome: [] }
}

export const useApplicationTrackingBoard = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.applications.trackingBoard,
    queryFn: fetchApplicationTrackingBoard,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    applicationTrackingData: data || { applied: [], interviewing: [], outcome: [] },
    isLoading,
    error,
    refetch,
  }
}
