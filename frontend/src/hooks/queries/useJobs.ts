/**
 * React Query hooks for job-related operations
 * Provides data fetching, caching, and state management for jobs
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, applicationService } from '../../services/jobService';
import type {
  JobSearchParams,
  CreateJobRequest,
  UpdateJobRequest,
  JobDraftGenerateRequest,
  JobDraftResponse,
} from '../../types/job';
import type { CreateApplicationRequest, UpdateApplicationRequest } from '../../types/application';

// Query keys for consistent caching
export const jobQueryKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobQueryKeys.all, 'list'] as const,
  list: (params?: JobSearchParams) => [...jobQueryKeys.lists(), params] as const,
  recommendations: (limit?: number) => [...jobQueryKeys.all, 'recommendations', limit] as const,
  search: (params?: JobSearchParams) => [...jobQueryKeys.all, 'search', params] as const,
  details: () => [...jobQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobQueryKeys.details(), id] as const,
  byCompany: (companyId: string) => [...jobQueryKeys.all, 'company', companyId] as const,
};

export const applicationQueryKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationQueryKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...applicationQueryKeys.lists(), params] as const,
  details: () => [...applicationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationQueryKeys.details(), id] as const,
  byJob: (jobId: string) => [...applicationQueryKeys.all, 'job', jobId] as const,
  byCandidate: (candidateId: string) => [...applicationQueryKeys.all, 'candidate', candidateId] as const,
};

// Job Query Hooks
export function useJobs(params?: JobSearchParams) {
  return useQuery({
    queryKey: jobQueryKeys.list(params),
    queryFn: async () => {
      return await jobService.getJobs(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePersonalizedRecommendations(
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['jobs', 'personalized', userId, page, limit],
    queryFn: async () => {
      return await jobService.getPersonalizedRecommendations(userId, page, limit);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId, // Only run if userId is provided
  });
}

export function useRecommendedJobs(limit: number = 5) {
  return useQuery({
    queryKey: jobQueryKeys.recommendations(limit),
    queryFn: async () => {
      return await jobService.getRecommendedJobs(limit);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useJobSearch(params?: JobSearchParams) {
  return useQuery({
    queryKey: jobQueryKeys.search(params),
    queryFn: async () => {
      return await jobService.searchJobs(params);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for search results)
    gcTime: 5 * 60 * 1000, // 5 minutes
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

export function useJobsByCompany(userId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...jobQueryKeys.byCompany(userId), params],
    queryFn: async () => {
      return await jobService.getJobsByCompany(userId, params);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Job Mutation Hooks
export function useGenerateJobDraft() {
  return useMutation({
    mutationFn: async (data: JobDraftGenerateRequest): Promise<JobDraftResponse> => {
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
      // Invalidate and refetch job lists
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
    },
    onError: (error: unknown) => {
      // Log error for debugging (errors are handled in component try/catch)
      console.error('Job creation error:', error);
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateJobRequest }) => {
      return await jobService.updateJob(id, data);
    },
    onSuccess: (data, variables) => {
      // Update the specific job in cache
      queryClient.setQueryData(jobQueryKeys.detail(variables.id), data);
      // Invalidate job lists
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
      // Remove the job from cache
      queryClient.removeQueries({ queryKey: jobQueryKeys.detail(id) });
      // Invalidate job lists
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
    },
  });
}

// Application Query Hooks
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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

export function useApplicationsByJob(jobId: string, params?: { page?: number; limit?: number }) {
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

export function useApplicationsByCandidate(candidateId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...applicationQueryKeys.byCandidate(candidateId), params],
    queryFn: async () => {
      return await applicationService.getApplicationsByCandidate(candidateId, params);
    },
    enabled: !!candidateId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Application Mutation Hooks
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationRequest) => {
      return await applicationService.createApplication(data);
    },
    onSuccess: () => {
      // Invalidate application lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateApplicationRequest }) => {
      return await applicationService.updateApplication(id, data);
    },
    onSuccess: (data, variables) => {
      // Update the specific application in cache
      queryClient.setQueryData(applicationQueryKeys.detail(variables.id), data);
      // Invalidate application lists
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
      // Remove the application from cache
      queryClient.removeQueries({ queryKey: applicationQueryKeys.detail(id) });
      // Invalidate application lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
    },
  });
}

// Utility hooks for common patterns
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
