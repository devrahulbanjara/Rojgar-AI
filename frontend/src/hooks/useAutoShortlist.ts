'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'sonner'

export function useAutoShortlist(jobId: string | null) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['autoShortlist', jobId],
    queryFn: async () => {
      if (!jobId) return null
      return await api.autoShortlist.get(jobId)
    },
    enabled: !!jobId,
    staleTime: 0,
  })

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is required')
      return await api.autoShortlist.toggle(jobId)
    },
    onSuccess: data => {
      queryClient.setQueryData(['autoShortlist', jobId], data)
      toast.success(`Auto shortlist ${data.auto_shortlist ? 'enabled' : 'disabled'}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle auto shortlist: ${error.message}`)
    },
  })

  return {
    autoShortlist: data?.auto_shortlist ?? false,
    isLoading,
    error,
    toggle: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  }
}
