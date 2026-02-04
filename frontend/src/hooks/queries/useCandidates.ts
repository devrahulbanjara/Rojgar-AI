import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { CandidateService } from '../../services/candidateService'
import { CandidateListResponse, CandidateFilters } from '../../types/candidate'

export function useCandidates(
  page: number = 1,
  limit: number = 20,
  filters?: CandidateFilters,
  enabled: boolean = true
): UseQueryResult<CandidateListResponse, Error> {
  return useQuery({
    queryKey: ['candidates', page, limit, filters],
    queryFn: () => CandidateService.getCandidates(page, limit, filters),
    enabled,
    staleTime: 0, // Always consider data stale, fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
  })
}

export function useCandidateSearch(
  query: string,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
): UseQueryResult<CandidateListResponse, Error> {
  return useQuery({
    queryKey: ['candidates', 'search', query, page, limit],
    queryFn: () => CandidateService.searchCandidates(query, page, limit),
    enabled: enabled && query.trim().length > 0,
    staleTime: 0, // Always consider data stale, fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
  })
}