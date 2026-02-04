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
      if (filters?.search) {
        params.search = filters.search
      }

      return await api.candidates.list(params)
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
    return this.getCandidates(page, limit, { search: query })
  }
}