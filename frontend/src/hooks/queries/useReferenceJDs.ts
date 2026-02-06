import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referenceJDService, CreateReferenceJDRequest } from '../../services/referenceJDService'
import { toast } from 'sonner'

export const referenceJDKeys = {
  all: ['referenceJDs'] as const,
  lists: () => [...referenceJDKeys.all, 'list'] as const,
  list: () => [...referenceJDKeys.lists()] as const,
  details: () => [...referenceJDKeys.all, 'detail'] as const,
  detail: (id: string) => [...referenceJDKeys.details(), id] as const,
}

export function useReferenceJDs(enabled: boolean = true) {
  return useQuery({
    queryKey: referenceJDKeys.list(),
    queryFn: () => referenceJDService.getReferenceJDs(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })
}

export function useReferenceJD(id: string | null) {
  return useQuery({
    queryKey: referenceJDKeys.detail(id || ''),
    queryFn: () => (id ? referenceJDService.getReferenceJDById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateReferenceJD() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReferenceJDRequest) => referenceJDService.createReferenceJD(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceJDKeys.list() })

      toast.success('Reference JD created successfully!')
    },
    onError: (error: Error) => {
      let errorMessage = 'Failed to create reference JD'

      if (error.message) {
        errorMessage = error.message
      }

      const apiError = error as Error & {
        data?: { detail?: string; message?: string }
      }
      if (apiError.data) {
        if (typeof apiError.data === 'string') {
          errorMessage = apiError.data
        } else if (apiError.data.detail) {
          errorMessage = apiError.data.detail
        } else if (apiError.data.message) {
          errorMessage = apiError.data.message
        }
      }

      toast.error(errorMessage)
      console.error('Error creating reference JD:', error)
      console.error('Error details:', {
        message: error.message,
        data: apiError.data,
      })
    },
  })
}

export function useConvertJobToReferenceJD() {
  const createMutation = useCreateReferenceJD()

  return useMutation({
    mutationFn: async (job: {
      description?: string
      role_overview?: string
      required_skills_and_experience?: string[]
      requiredSkillsAndExperience?: string[]
      nice_to_have?: string[]
      niceToHave?: string[]
      benefits?: string[]
    }) => {
      const referenceJDData = referenceJDService.convertJobToReferenceJD(job)
      return createMutation.mutateAsync(referenceJDData)
    },
    onSuccess: () => {
      toast.success('Job converted to Reference JD successfully!')
    },
    onError: (error: Error) => {
      let errorMessage = 'Failed to convert job to reference JD'

      if (error.message) {
        errorMessage = error.message
      }

      const apiError = error as Error & {
        data?: { detail?: string; message?: string }
      }
      if (apiError.data) {
        if (typeof apiError.data === 'string') {
          errorMessage = apiError.data
        } else if (apiError.data.detail) {
          errorMessage = apiError.data.detail
        } else if (apiError.data.message) {
          errorMessage = apiError.data.message
        }
      }

      toast.error(errorMessage)
      console.error('Error converting job to reference JD:', error)
      console.error('Error details:', {
        message: error.message,
        data: apiError.data,
      })
    },
  })
}

export function useUpdateReferenceJD() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateReferenceJDRequest }) =>
      referenceJDService.updateReferenceJD(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceJDKeys.list() })
      toast.success('Reference JD updated successfully!')
    },
    onError: (error: Error) => {
      let errorMessage = 'Failed to update reference JD'

      if (error.message) {
        errorMessage = error.message
      }

      const apiError = error as Error & {
        data?: { detail?: string; message?: string }
      }
      if (apiError.data) {
        if (typeof apiError.data === 'string') {
          errorMessage = apiError.data
        } else if (apiError.data.detail) {
          errorMessage = apiError.data.detail
        } else if (apiError.data.message) {
          errorMessage = apiError.data.message
        }
      }

      toast.error(errorMessage)
      console.error('Error updating reference JD:', error)
    },
  })
}

export function useDeleteReferenceJD() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => referenceJDService.deleteReferenceJD(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceJDKeys.list() })
      toast.success('Reference JD deleted successfully!')
    },
    onError: (error: Error) => {
      let errorMessage = 'Failed to delete reference JD'

      if (error.message) {
        errorMessage = error.message
      }

      const apiError = error as Error & {
        data?: { detail?: string; message?: string }
      }
      if (apiError.data) {
        if (typeof apiError.data === 'string') {
          errorMessage = apiError.data
        } else if (apiError.data.detail) {
          errorMessage = apiError.data.detail
        } else if (apiError.data.message) {
          errorMessage = apiError.data.message
        }
      }

      toast.error(errorMessage)
      console.error('Error deleting reference JD:', error)
    },
  })
}
