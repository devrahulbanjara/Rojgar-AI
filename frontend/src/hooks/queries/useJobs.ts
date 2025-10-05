/**
 * React Query hooks for job-related operations
 * Provides data fetching, caching, and state management for jobs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService, applicationService } from '../../services/jobService';
import type { 
  JobSearchParams, 
  CreateJobRequest, 
  UpdateJobRequest,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from '../../types/job';

// Query keys for consistent caching
export const jobQueryKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobQueryKeys.all, 'list'] as const,
  list: (params?: JobSearchParams) => [...jobQueryKeys.lists(), params] as const,
  details: () => [...jobQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobQueryKeys.details(), id] as const,
  featured: () => [...jobQueryKeys.all, 'featured'] as const,
  byCompany: (companyId: string) => [...jobQueryKeys.all, 'company', companyId] as const,
};

export const applicationQueryKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationQueryKeys.all, 'list'] as const,
  list: (params?: any) => [...applicationQueryKeys.lists(), params] as const,
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
      const response = await jobService.getJobs(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch jobs');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobQueryKeys.detail(id),
    queryFn: async () => {
      const response = await jobService.getJobById(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch job');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useFeaturedJobs(limit: number = 10) {
  return useQuery({
    queryKey: [...jobQueryKeys.featured(), limit],
    queryFn: async () => {
      const response = await jobService.getFeaturedJobs(limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch featured jobs');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useJobsByCompany(companyId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...jobQueryKeys.byCompany(companyId), params],
    queryFn: async () => {
      const response = await jobService.getJobsByCompany(companyId, params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch company jobs');
      }
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Job Mutation Hooks
export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      const response = await jobService.createJob(data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create job');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch job lists
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.featured() });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateJobRequest }) => {
      const response = await jobService.updateJob(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update job');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific job in cache
      queryClient.setQueryData(jobQueryKeys.detail(variables.id), data);
      // Invalidate job lists
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.featured() });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await jobService.deleteJob(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete job');
      }
      return response.data;
    },
    onSuccess: (_, id) => {
      // Remove the job from cache
      queryClient.removeQueries({ queryKey: jobQueryKeys.detail(id) });
      // Invalidate job lists
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.featured() });
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
      const response = await applicationService.getApplications(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch applications');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationQueryKeys.detail(id),
    queryFn: async () => {
      const response = await applicationService.getApplicationById(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch application');
      }
      return response.data;
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
      const response = await applicationService.getApplicationsByJob(jobId, params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch job applications');
      }
      return response.data;
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
      const response = await applicationService.getApplicationsByCandidate(candidateId, params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch candidate applications');
      }
      return response.data;
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
      const response = await applicationService.createApplication(data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create application');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate application lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      // Invalidate job-specific applications
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.byJob(data.jobId) });
      }
      // Invalidate candidate-specific applications
      if (data?.candidateId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.byCandidate(data.candidateId) });
      }
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateApplicationRequest }) => {
      const response = await applicationService.updateApplication(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update application');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific application in cache
      queryClient.setQueryData(applicationQueryKeys.detail(variables.id), data);
      // Invalidate application lists
      queryClient.invalidateQueries({ queryKey: applicationQueryKeys.lists() });
      if (data?.jobId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.byJob(data.jobId) });
      }
      if (data?.candidateId) {
        queryClient.invalidateQueries({ queryKey: applicationQueryKeys.byCandidate(data.candidateId) });
      }
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await applicationService.deleteApplication(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete application');
      }
      return response.data;
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
    job: jobQuery.data?.job,
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
