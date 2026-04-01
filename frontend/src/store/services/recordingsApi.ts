import { type ApiResponse, baseApi } from './baseApi'

// ---------------------------------------------------------------------------
// Types — mirrors backend InterviewRecordingResponse
// ---------------------------------------------------------------------------

export type RecordingStatus =
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'evaluating'
  | 'evaluated'
  | 'failed'

export interface InterviewRecording {
  id: string
  application_id: string
  s3_audio_url: string
  transcript: string | null
  evaluation: string | null
  status: RecordingStatus
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

export interface BatchTranscribeCandidate {
  application_id: string
  job_id: string
  candidate_name: string
  candidate_email: string
  latest_recording_id: string | null
  latest_recording_duration_seconds: number | null
  latest_recording_status: RecordingStatus | null
  transcript_available: boolean
  can_batch_transcribe: boolean
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

export const recordingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecordings: builder.query<ApiResponse<InterviewRecording[]>, string>({
      query: (applicationId) =>
        `${BACKEND}/interview-recordings/applications/${applicationId}/recordings`,
      providesTags: (_result, _error, appId) => [{ type: 'Recordings', id: appId }],
    }),

    uploadRecording: builder.mutation<
      ApiResponse<InterviewRecording>,
      { applicationId: string; file: Blob; durationSeconds?: number }
    >({
      query: ({ applicationId, file, durationSeconds }) => {
        const formData = new FormData()
        formData.append('file', file, 'recording.webm')
        if (durationSeconds !== undefined) {
          formData.append('duration_seconds', String(Math.round(durationSeconds)))
        }
        return {
          url: `${BACKEND}/interview-recordings/applications/${applicationId}/recordings`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Recordings', id: applicationId },
      ],
    }),

    transcribeRecording: builder.mutation<ApiResponse<InterviewRecording>, string>({
      query: (recordingId) => ({
        url: `${BACKEND}/interview-recordings/recordings/${recordingId}/transcribe`,
        method: 'POST',
      }),
      invalidatesTags: ['Recordings'],
    }),

    evaluateRecording: builder.mutation<ApiResponse<InterviewRecording>, string>({
      query: (recordingId) => ({
        url: `${BACKEND}/interview-recordings/recordings/${recordingId}/evaluate`,
        method: 'POST',
      }),
      invalidatesTags: ['Recordings'],
    }),

    deleteRecording: builder.mutation<
      ApiResponse<null>,
      { recordingId: string; applicationId: string }
    >({
      query: ({ recordingId }) => ({
        url: `${BACKEND}/interview-recordings/recordings/${recordingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        { type: 'Recordings', id: applicationId },
      ],
    }),

    batchTranscribe: builder.mutation<
      ApiResponse<InterviewRecording[]>,
      { jobId: string; applicationIds: string[] }
    >({
      query: ({ jobId, applicationIds }) => ({
        url: `${BACKEND}/interview-recordings/jobs/${jobId}/recordings/batch-transcribe`,
        method: 'POST',
        body: { application_ids: applicationIds },
      }),
      invalidatesTags: ['Recordings'],
    }),

    getBatchTranscribeCandidates: builder.query<ApiResponse<BatchTranscribeCandidate[]>, string>({
      query: (jobId) => `${BACKEND}/interview-recordings/jobs/${jobId}/recordings/batch-candidates`,
      providesTags: (_result, _error, jobId) => [{ type: 'Recordings', id: `batch:${jobId}` }],
    }),
  }),
})

export const {
  useGetRecordingsQuery,
  useUploadRecordingMutation,
  useTranscribeRecordingMutation,
  useEvaluateRecordingMutation,
  useDeleteRecordingMutation,
  useBatchTranscribeMutation,
  useGetBatchTranscribeCandidatesQuery,
} = recordingsApi
