import { apiClient } from '../lib/api'

const recruiterEndpoints = {
  actionItems: {
    pendingEmails: '/api/v1/recruiter/action-items/pending-emails',
    pendingShortlists: '/api/v1/recruiter/action-items/pending-shortlists',
  },
  interviews: '/api/v1/recruiter/interviews',
  dashboardStats: '/api/v1/recruiter/stats/dashboard-stats',
  candidates: {
    list: '/api/v1/recruiter/candidates',
    search: '/api/v1/recruiter/candidates/search',
    detail: (id: string) => `/api/v1/recruiter/candidates/${id}`,
    history: (candidateId: string) => `/api/v1/recruiter/candidates/${candidateId}/history`,
  },
} as const

export interface DashboardStatsResponse {
  active_jobs: number
  active_candidates: number
  pending_email_drafts: number
  interviews_this_week: number
}

export interface InterviewItem {
  interview_id: string
  application_id: string
  candidate_email: string
  candidate_name?: string
  job_title?: string
  start_time: string
  end_time: string
  status: string
  meeting_url?: string
}

export class RecruiterService {
  static async getDashboardStats(): Promise<DashboardStatsResponse> {
    return apiClient.get<DashboardStatsResponse>(recruiterEndpoints.dashboardStats)
  }

  static async getPendingEmails() {
    return apiClient.get<{ drafts: unknown[] }>(recruiterEndpoints.actionItems.pendingEmails)
  }

  static async getPendingShortlists() {
    return apiClient.get<{ jobs: unknown[] }>(recruiterEndpoints.actionItems.pendingShortlists)
  }

  static async getInterviews(params?: { start_date?: string; end_date?: string; job_id?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)
    if (params?.job_id) searchParams.set('job_id', params.job_id)

    const query = searchParams.toString()
    const url = query ? `${recruiterEndpoints.interviews}?${query}` : recruiterEndpoints.interviews

    return apiClient.get<InterviewItem[]>(url)
  }

  static async getCandidateHistory(candidateId: string) {
    return apiClient.get(recruiterEndpoints.candidates.history(candidateId))
  }
}
