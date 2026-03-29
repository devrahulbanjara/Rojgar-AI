import type { ApiResponse } from './baseApi'
import { baseApi } from './baseApi'

export interface GapItem {
  area: string
  severity: 'critical' | 'preferred' | 'bonus'
  suggestion: string
}

export interface GapAnalysisResult {
  missing_skills: GapItem[]
  experience_gaps: GapItem[]
  things_to_add_to_summary: string[]
  things_to_remove_or_deemphasize: string[]
  things_already_strong: string[]
  overall_score_estimate: number
  overall_verdict: string
}

export interface AutoPatchResponse {
  updated_fields: string[]
  message: string
}

export const resumeGapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    analyzeResumeGap: builder.mutation<
      ApiResponse<GapAnalysisResult>,
      { resume_id: string; job_id: string }
    >({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/resume-gap/analyze`,
        method: 'POST',
        body,
      }),
    }),

    autoPatchResume: builder.mutation<
      ApiResponse<AutoPatchResponse>,
      { resume_id: string; job_id: string; gap_result: GapAnalysisResult }
    >({
      query: (body) => ({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/resume-gap/auto-patch`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Resumes', 'Applications'],
    }),
  }),
})

export const { useAnalyzeResumeGapMutation, useAutoPatchResumeMutation } = resumeGapApi
