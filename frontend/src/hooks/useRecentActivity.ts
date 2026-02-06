'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient'
import { apiClient } from '../lib/api'

export interface ActivityItem {
  id: string
  type: 'application' | 'interview' | 'offer' | 'job_post' | 'status_change'
  user: string
  action: string
  target: string
  timestamp: string
  metadata: Record<string, unknown>
}

interface RecentActivityResponse {
  activities: ActivityItem[]
}

const fetchRecentActivity = async (): Promise<ActivityItem[]> => {
  try {
    const response = await apiClient.get<RecentActivityResponse>(
      '/api/v1/recruiter/stats/recent-activity?limit=20'
    )
    return response.activities || []
  } catch {
    return []
  }
}

export const useRecentActivity = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: fetchRecentActivity,
    staleTime: 0,

    gcTime: 5 * 60 * 1000,

    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
