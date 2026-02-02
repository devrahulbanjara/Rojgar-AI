/**
 * Recruiters Query Hooks
 * React Query hooks for organization recruiters API calls
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  OrganizationService,
  Recruiter,
  CreateRecruiterRequest,
  UpdateRecruiterRequest,
} from '../../services/organizationService'
import { queryKeys } from '../../lib/queryClient'

// Get all recruiters query
export const useRecruiters = () => {
  return useQuery({
    queryKey: queryKeys.organization.recruiters.all,
    queryFn: async (): Promise<Recruiter[]> => {
      return await OrganizationService.getRecruiters()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get a specific recruiter query
export const useRecruiter = (id: string) => {
  return useQuery({
    queryKey: queryKeys.organization.recruiters.detail(id),
    queryFn: async (): Promise<Recruiter> => {
      return await OrganizationService.getRecruiterById(id)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Create recruiter mutation
export const useCreateRecruiter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRecruiterRequest): Promise<Recruiter> => {
      return await OrganizationService.createRecruiter(data)
    },
    onSuccess: () => {
      // Invalidate and refetch recruiters list
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.all,
      })
    },
  })
}

// Update recruiter mutation
export const useUpdateRecruiter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateRecruiterRequest
    }): Promise<Recruiter> => {
      return await OrganizationService.updateRecruiter(id, data)
    },
    onSuccess: data => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.all,
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.detail(data.id),
      })
    },
  })
}

// Delete recruiter mutation
export const useDeleteRecruiter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await OrganizationService.deleteRecruiter(id)
    },
    onSuccess: () => {
      // Invalidate and refetch recruiters list
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.all,
      })
    },
  })
}
