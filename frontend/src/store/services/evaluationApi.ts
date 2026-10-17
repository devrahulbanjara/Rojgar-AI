import { type ApiResponse, baseApi } from './baseApi'

export interface EvaluationCriterion {
  key: string
  label: string
  max_score: number
  weight: number
}

export interface JobEvaluationSchema {
  id: string
  job_id: string
  version: number
  criteria: EvaluationCriterion[]
  human_weight: number
  llm_weight: number
  created_at: string
  updated_at: string
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

export const evaluationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobEvaluationSchema: builder.query<ApiResponse<JobEvaluationSchema | null>, string>({
      query: (jobId) => `${BACKEND}/interviews/jobs/${jobId}/evaluation-schema`,
      providesTags: (_result, _error, jobId) => [{ type: 'Evaluation', id: `job:${jobId}` }],
    }),

    upsertJobEvaluationSchema: builder.mutation<
      ApiResponse<JobEvaluationSchema>,
      {
        jobId: string
        criteria: EvaluationCriterion[]
        human_weight: number
        llm_weight: number
      }
    >({
      query: ({ jobId, ...body }) => ({
        url: `${BACKEND}/interviews/jobs/${jobId}/evaluation-schema`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: 'Evaluation', id: `job:${jobId}` },
        'Evaluation',
      ],
    }),
  }),
})

export const { useGetJobEvaluationSchemaQuery, useUpsertJobEvaluationSchemaMutation } =
  evaluationApi
