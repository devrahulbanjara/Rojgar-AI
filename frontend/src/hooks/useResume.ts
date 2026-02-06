import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ResumeDetail } from '../types/resume'

export function useResume(applicationId: string, enabled: boolean = true) {
  return useQuery<ResumeDetail>({
    queryKey: ['resume', applicationId],
    queryFn: async (): Promise<ResumeDetail> => {
      const response = await api.candidates.getResume(applicationId)
      return response as ResumeDetail
    },
    enabled: enabled && !!applicationId,
    staleTime: 10 * 60 * 1000,

    refetchOnWindowFocus: false,
  })
}
