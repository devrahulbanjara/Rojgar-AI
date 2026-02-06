'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  OrganizationService,
  Recruiter,
  CreateRecruiterRequest,
  UpdateRecruiterRequest,
} from '../../services/organizationService'
import { queryKeys } from '../../lib/queryClient'

export const useRecruiters = () => {
  return useQuery({
    queryKey: queryKeys.organization.recruiters.all,
    queryFn: async (): Promise<Recruiter[]> => {
      return await OrganizationService.getRecruiters()
    },
    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,
  })
}

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

export const useCreateRecruiter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRecruiterRequest): Promise<Recruiter> => {
      return await OrganizationService.createRecruiter(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.all,
      })
    },
  })
}

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.all,
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.detail(data.id),
      })
    },
  })
}

export const useDeleteRecruiter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await OrganizationService.deleteRecruiter(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.recruiters.all,
      })
    },
  })
}
