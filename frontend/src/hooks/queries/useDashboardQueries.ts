'use client'

import { useQuery } from '@tanstack/react-query'
import type { DashboardStats, UserType } from '../../types'
import { queryKeys } from '../../lib/queryClient'

export const useDashboardStats = (userType?: UserType) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, userType || 'recruiter'],
    queryFn: async (): Promise<DashboardStats> => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (userType === 'recruiter') {
        return {
          totalApplications: 145,
          activeJobs: 12,
          interviewsScheduled: 8,
          responseRate: 78,
        }
      } else {
        return {
          totalApplications: 23,
          activeJobs: 5,
          interviewsScheduled: 3,
          responseRate: 85,
        }
      }
    },
    enabled: !!userType,

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,
  })
}

export const useDashboardActivity = (userId?: string) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.activity, userId || ''],
    queryFn: async (): Promise<unknown[]> => {
      await new Promise(resolve => setTimeout(resolve, 800))

      return [
        {
          id: '1',
          type: 'application',
          message: 'New application received for Frontend Developer position',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'interview',
          message: 'Interview scheduled with John Doe',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'job',
          message: 'New job posting created: React Developer',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
    },
    enabled: !!userId,

    staleTime: 2 * 60 * 1000,

    gcTime: 5 * 60 * 1000,
  })
}
