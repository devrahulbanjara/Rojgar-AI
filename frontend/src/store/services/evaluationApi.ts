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

export interface EvaluationScore {
  id: string
  application_id: string
  job_id: string
  schema_id: string | null
  schema_version: number
  evaluator_type: 'human' | 'llm'
  scores: Record<string, number>
  criteria_snapshot: EvaluationCriterion[]
  notes: string | null
  weighted_total: number | null
  submitted_by_user_id: string | null
  created_at: string
  updated_at: string
}

export interface CombinedEvaluation {
  application_id: string
  job_id: string
  schema: JobEvaluationSchema | null
  human: EvaluationScore | null
  llm: EvaluationScore | null
  final_score: number | null
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

    getCombinedEvaluation: builder.query<ApiResponse<CombinedEvaluation>, string>({
      query: (applicationId) => `${BACKEND}/interviews/applications/${applicationId}/evaluation`,
      providesTags: (_result, _error, applicationId) => [
        { type: 'Evaluation', id: `application:${applicationId}` },
      ],
    }),

    submitHumanEvaluation: builder.mutation<
      ApiResponse<EvaluationScore>,
      {
        applicationId: string
        scores: Record<string, number>
        notes?: string | null
      }
    >({
      query: ({ applicationId, ...body }) => ({
        url: `${BACKEND}/interviews/applications/${applicationId}/evaluation/human`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Evaluation', id: `application:${applicationId}` },
        'Candidates',
      ],
    }),

    runLlmEvaluation: builder.mutation<ApiResponse<EvaluationScore>, string>({
      query: (applicationId) => ({
        url: `${BACKEND}/interviews/applications/${applicationId}/evaluation/llm`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, applicationId) => [
        { type: 'Evaluation', id: `application:${applicationId}` },
        'Candidates',
      ],
    }),
  }),
})

export const {
  useGetJobEvaluationSchemaQuery,
  useUpsertJobEvaluationSchemaMutation,
  useGetCombinedEvaluationQuery,
  useSubmitHumanEvaluationMutation,
  useRunLlmEvaluationMutation,
} = evaluationApi
