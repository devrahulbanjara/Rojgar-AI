import { baseApi } from "./baseApi";
import type {
  RecruiterProfile,
  UpdateRecruiterProfileRequest,
  JobListing,
  JobApplication,
  InterviewSchedule,
  ScheduleInterviewRequest,
  Paginated,
} from "@/lib/types/user";

// Re-export canonical types for components that import from this file
export type { RecruiterProfile, InterviewSchedule, ScheduleInterviewRequest };

// ---------------------------------------------------------------------------
// Recruiter API
// ---------------------------------------------------------------------------

export const recruiterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /recruiter/me */
    getRecruiterProfile: builder.query<RecruiterProfile, void>({
      query: () => "/recruiter/me",
      providesTags: ["User"],
    }),

    /** PATCH /recruiter/me */
    updateRecruiterProfile: builder.mutation<
      RecruiterProfile,
      UpdateRecruiterProfileRequest
    >({
      query: (body) => ({
        url: "/recruiter/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    /** GET /recruiter/jobs — jobs managed by this recruiter */
    getRecruiterJobs: builder.query<
      Paginated<JobListing>,
      { page?: number; limit?: number; status?: JobListing["status"] }
    >({
      query: ({ page = 1, limit = 10, status } = {}) => ({
        url: "/recruiter/jobs",
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: ["Jobs"],
    }),

    /** GET /recruiter/jobs/:jobId/applications */
    getJobApplications: builder.query<
      Paginated<JobApplication>,
      {
        jobId: string;
        page?: number;
        limit?: number;
        status?: JobApplication["status"];
      }
    >({
      query: ({ jobId, page = 1, limit = 10, status }) => ({
        url: `/recruiter/jobs/${jobId}/applications`,
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: (_result, _error, { jobId }) => [
        "Applications",
        { type: "Applications", id: jobId },
      ],
    }),

    /** PATCH /recruiter/applications/:applicationId/status */
    updateApplicationStatus: builder.mutation<
      JobApplication,
      { applicationId: string; status: JobApplication["status"] }
    >({
      query: ({ applicationId, status }) => ({
        url: `/recruiter/applications/${applicationId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        "Applications",
        "Candidates",
        { type: "Applications", id: applicationId },
      ],
    }),

    /** GET /recruiter/candidates */
    getRecruiterCandidates: builder.query<
      Paginated<JobApplication>,
      {
        page?: number;
        limit?: number;
        jobId?: string;
        status?: JobApplication["status"];
      }
    >({
      query: ({ page = 1, limit = 10, jobId, status } = {}) => ({
        url: "/recruiter/candidates",
        params: {
          page,
          limit,
          ...(jobId && { job_id: jobId }),
          ...(status && { status }),
        },
      }),
      providesTags: ["Candidates"],
    }),

    /** GET /recruiter/interviews */
    getInterviews: builder.query<
      InterviewSchedule[],
      { status?: InterviewSchedule["status"] }
    >({
      query: ({ status } = {}) => ({
        url: "/recruiter/interviews",
        params: status ? { status } : undefined,
      }),
      providesTags: ["Interviews"],
    }),

    /** POST /recruiter/interviews */
    scheduleInterview: builder.mutation<
      InterviewSchedule,
      ScheduleInterviewRequest
    >({
      query: (body) => ({
        url: "/recruiter/interviews",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Interviews"],
    }),

    /** PATCH /recruiter/interviews/:id */
    updateInterview: builder.mutation<
      InterviewSchedule,
      Partial<ScheduleInterviewRequest> & {
        id: string;
        status?: InterviewSchedule["status"];
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/recruiter/interviews/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Interviews"],
    }),

    /** DELETE /recruiter/interviews/:id */
    cancelInterview: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/recruiter/interviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Interviews"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRecruiterProfileQuery,
  useUpdateRecruiterProfileMutation,
  useGetRecruiterJobsQuery,
  useGetJobApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useGetRecruiterCandidatesQuery,
  useGetInterviewsQuery,
  useScheduleInterviewMutation,
  useUpdateInterviewMutation,
  useCancelInterviewMutation,
} = recruiterApi;
