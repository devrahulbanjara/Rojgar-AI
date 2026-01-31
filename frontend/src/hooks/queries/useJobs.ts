"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { jobService, applicationService } from "../../services/jobService";
import type {
  JobSearchParams,
  CreateJobRequest,
  UpdateJobRequest,
  JobDraftGenerateRequest,
  JobDraftResponse,
} from "../../types/job";
import type {
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "../../types/application";

export const jobQueryKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobQueryKeys.all, "list"] as const,
  list: (params?: JobSearchParams) =>
    [...jobQueryKeys.lists(), params] as const,
  recommendations: (limit?: number) =>
    [...jobQueryKeys.all, "recommendations", limit] as const,
  search: (params?: JobSearchParams) =>
    [...jobQueryKeys.all, "search", params] as const,
  details: () => [...jobQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...jobQueryKeys.details(), id] as const,
  byCompany: (companyId: string) =>
    [...jobQueryKeys.all, "company", companyId] as const,
  savedJobs: () => [...jobQueryKeys.all, "saved"] as const,
  savedJobsList: (page?: number, limit?: number) =>
    [...jobQueryKeys.savedJobs(), page, limit] as const,
};

export const applicationQueryKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationQueryKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...applicationQueryKeys.lists(), params] as const,
  details: () => [...applicationQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationQueryKeys.details(), id] as const,
  byJob: (jobId: string) =>
    [...applicationQueryKeys.all, "job", jobId] as const,
  byCandidate: (candidateId: string) =>
    [...applicationQueryKeys.all, "candidate", candidateId] as const,
};

export function useJobs(params?: JobSearchParams) {
  return useQuery({
    queryKey: jobQueryKeys.list(params),
    queryFn: async () => {
      return await jobService.getJobs(params);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePersonalizedRecommendations(
  userId: string,
  page: number = 1,
  limit: number = 10,
  filters?: {
    employmentType?: string;
    locationType?: string;
  },
) {
  const isEnabled = !!userId && userId.length > 0;
  
  // Always run the query request, even if it might fail
  console.log("usePersonalizedRecommendations hook:", {
    userId,
    isEnabled,
    page,
    limit,
    filters,
  });
  
  return useQuery({
    queryKey: ["jobs", "personalized", userId, page, limit, filters],
    queryFn: async () => {
      console.log("Fetching personalized recommendations...");
      return await jobService.getPersonalizedRecommendations(
        userId,
        page,
        limit,
        filters,
      );
    },
    staleTime: 0,
    gcTime: 0,
    // Disable caching completely to ensure fresh requests
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    // Force network request even if key changed
    networkMode: 'always',
  });
}

export function useRecommendedJobs(limit: number = 5) {
  return useQuery({
    queryKey: jobQueryKeys.recommendations(limit),
    queryFn: async () => {
      return await jobService.getRecommendedJobs(limit);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useJobSearch(
  params?: JobSearchParams & {
    employmentType?: string;
    locationType?: string;
    userId?: string;
  },
) {
  return useQuery({
    queryKey: jobQueryKeys.search(params),
    queryFn: async () => {
      return await jobService.searchJobs(params);
    },
    staleTime: 0,
    gcTime: 0,
    enabled: !!params,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobQueryKeys.detail(id),
    queryFn: async () => {
      return await jobService.getJobById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useJobsByCompany(
  userId: string,
  params?: { organizationId?: string; page?: number; limit?: number },
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: [...jobQueryKeys.byCompany(userId), params],
    queryFn: async () => {
      return await jobService.getJobsByCompany(userId, params);
    },
    enabled: enabled && (!!userId || !!params?.organizationId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGenerateJobDraft() {
  return useMutation({
    mutationFn: async (
      data: JobDraftGenerateRequest,
    ): Promise<JobDraftResponse> => {
      return await jobService.generateJobDraft(data);
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      return await jobService.createJob(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
    },
    onError: (error: unknown) => {
      console.error("Job creation error:", error);
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateJobRequest;
    }) => {
      return await jobService.updateJob(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(jobQueryKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
    },
  });
}

export function useExpireJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await jobService.expireJob(id);
    },
    onSuccess: (data, jobId) => {
      queryClient.setQueryData(jobQueryKeys.detail(jobId), data);
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await jobService.deleteJob(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: jobQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      toast.success("Job deleted successfully");
    },
    onError: (error: Error) => {
      const errorMessage =
        (error as { data?: { detail?: string; message?: string } })?.data
          ?.detail ||
        (error as { data?: { detail?: string; message?: string } })?.data
          ?.message ||
        error.message ||
        "Failed to delete job";
      toast.error("Failed to delete job", {
        description: errorMessage,
      });
    },
  });
}

export function useApplications(params?: {
  page?: number;
  limit?: number;
  jobId?: string;
  candidateId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: applicationQueryKeys.list(params),
    queryFn: async () => {
      return await applicationService.getApplications(params);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(id),
    queryFn: async () => {
      return await applicationService.getApplicationById(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useApplicationsByJob(
  jobId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: [...applicationQueryKeys.byJob(jobId), params],
    queryFn: async () => {
      return await applicationService.getApplicationsByJob(jobId, params);
    },
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useApplicationsByCandidate(
  candidateId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: [...applicationQueryKeys.byCandidate(candidateId), params],
    queryFn: async () => {
      return await applicationService.getApplicationsByCandidate(
        candidateId,
        params,
      );
    },
    enabled: !!candidateId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationRequest) => {
      return await applicationService.createApplication(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateApplicationRequest;
    }) => {
      return await applicationService.updateApplication(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(applicationQueryKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await applicationService.deleteApplication(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: applicationQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
    },
  });
}

export function useJobWithApplications(jobId: string) {
  const jobQuery = useJob(jobId);
  const applicationsQuery = useApplicationsByJob(jobId);

  return {
    job: jobQuery.data,
    applications: applicationsQuery.data,
    isLoading: jobQuery.isLoading || applicationsQuery.isLoading,
    error: jobQuery.error || applicationsQuery.error,
    refetch: () => {
      jobQuery.refetch();
      applicationsQuery.refetch();
    },
  };
}

export function useCandidateApplications(candidateId: string) {
  return useApplicationsByCandidate(candidateId);
}

export function useToggleSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      return await jobService.toggleSaveJob(jobId);
    },
    onSuccess: (data, jobId) => {
      const isNowSaved = data.status === "Job saved successfully";

      queryClient.setQueriesData(
        { queryKey: ["jobs"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          if (oldData.jobs && Array.isArray(oldData.jobs)) {
            return {
              ...oldData,
              jobs: oldData.jobs.map((job: any) =>
                (job.job_id || job.id) === jobId
                  ? { ...job, is_saved: isNowSaved }
                  : job,
              ),
            };
          }

          if (Array.isArray(oldData)) {
            return oldData.map((job: any) =>
              (job.job_id || job.id) === jobId
                ? { ...job, is_saved: isNowSaved }
                : job,
            );
          }

          return oldData;
        },
      );

      queryClient.setQueriesData(
        { queryKey: jobQueryKeys.detail(jobId) },
        (oldData: any) => {
          if (!oldData) return oldData;
          return { ...oldData, is_saved: isNowSaved };
        },
      );

      queryClient.invalidateQueries({ queryKey: jobQueryKeys.savedJobs() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.search() });
      queryClient.invalidateQueries({
        queryKey: jobQueryKeys.recommendations(),
      });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.detail(jobId) });

      const message = isNowSaved ? "Job saved successfully" : "Job unsaved";
      toast.success(message);
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error as { data?: { detail?: string; message?: string } })?.data
          ?.detail ||
        (error as { data?: { detail?: string; message?: string } })?.data
          ?.message ||
        (error as Error)?.message ||
        "Failed to save job";
      toast.error("Failed to save job", {
        description: errorMessage,
      });
    },
  });
}

export function useSavedJobs(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: jobQueryKeys.savedJobsList(page, limit),
    queryFn: async () => {
      return await jobService.getSavedJobs(page, limit);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
