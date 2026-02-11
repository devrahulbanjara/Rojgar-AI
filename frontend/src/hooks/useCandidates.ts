'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface SocialLink {
  social_link_id: string
  type: string
  url: string
}

export interface CandidateApplicationSummary {
  application_id: string
  job_id: string
  job_title: string
  candidate_id: string
  name: string
  email: string
  phone?: string
  picture?: string
  professional_headline?: string
  professional_summary?: string
  current_status: string
  applied_at: string
  score?: number
  feedback?: string
  social_links?: SocialLink[]
}

export interface RecruiterCandidateListResponse {
  candidates: CandidateApplicationSummary[]
  total: number
}

export function useCandidates(params?: Record<string, unknown>) {
  return useQuery<RecruiterCandidateListResponse>({
    queryKey: ['candidates', params],
    queryFn: async (): Promise<RecruiterCandidateListResponse> => {
      const response = await api.candidates.list(params)
      return response as RecruiterCandidateListResponse
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
