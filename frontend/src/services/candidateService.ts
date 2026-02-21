import { api } from '../lib/api'
import { CandidateListResponse, CandidateFilters } from '../types/candidate'

export class CandidateService {
  static async getCandidates(
    page: number = 1,
    limit: number = 20,
    filters?: CandidateFilters
  ): Promise<CandidateListResponse> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      }

      if (filters?.status) {
        params.status = filters.status
      }
      if (filters?.job_id) {
        params.job_id = filters.job_id
      }

      return await api.candidates.list(params) as Promise<CandidateListResponse>
    } catch (error) {
      console.error('Error fetching candidates:', error)
      throw error
    }
  }

  static async searchCandidates(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CandidateListResponse> {
    try {
      const params: Record<string, string> = {
        q: query,
        page: page.toString(),
        limit: limit.toString(),
      }

      return await api.candidates.search(params) as Promise<CandidateListResponse>
    } catch (error) {
      console.error('Error searching candidates:', error)
      throw error
    }
  }
}
