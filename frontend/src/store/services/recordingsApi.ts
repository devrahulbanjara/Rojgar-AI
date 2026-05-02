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
  }),
})

export const {
  useGetRecordingsQuery,
  useUploadRecordingMutation,
  useTranscribeRecordingMutation,
  useDeleteRecordingMutation,
} = recordingsApi
