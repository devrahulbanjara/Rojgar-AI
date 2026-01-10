import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  referenceJDService,
  CreateReferenceJDRequest,
} from "../../services/referenceJDService";
import { toast } from "sonner";

export const referenceJDKeys = {
  all: ["referenceJDs"] as const,
  lists: () => [...referenceJDKeys.all, "list"] as const,
  list: () => [...referenceJDKeys.lists()] as const,
  details: () => [...referenceJDKeys.all, "detail"] as const,
  detail: (id: string) => [...referenceJDKeys.details(), id] as const,
};

export function useReferenceJDs() {
  return useQuery({
    queryKey: referenceJDKeys.list(),
    queryFn: () => referenceJDService.getReferenceJDs(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReferenceJD(id: string | null) {
  return useQuery({
    queryKey: referenceJDKeys.detail(id || ""),
    queryFn: () => referenceJDService.getReferenceJDById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReferenceJD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReferenceJDRequest) =>
      referenceJDService.createReferenceJD(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceJDKeys.list() });

      toast.success("Reference JD created successfully!");
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to create reference JD";

      if (error.message) {
        errorMessage = error.message;
      }

      const apiError = error as Error & {
        data?: { detail?: string; message?: string };
      };
      if (apiError.data) {
        if (typeof apiError.data === "string") {
          errorMessage = apiError.data;
        } else if (apiError.data.detail) {
          errorMessage = apiError.data.detail;
        } else if (apiError.data.message) {
          errorMessage = apiError.data.message;
        }
      }

      toast.error(errorMessage);
      console.error("Error creating reference JD:", error);
      console.error("Error details:", {
        message: error.message,
        data: (error as any).data,
      });
    },
  });
}

export function useConvertJobToReferenceJD() {
  const createMutation = useCreateReferenceJD();

  return useMutation({
    mutationFn: async (job: {
      description?: string;
      role_overview?: string;
      required_skills_and_experience?: string[];
      requiredSkillsAndExperience?: string[];
      nice_to_have?: string[];
      niceToHave?: string[];
      benefits?: string[];
    }) => {
      const referenceJDData = referenceJDService.convertJobToReferenceJD(job);
      return createMutation.mutateAsync(referenceJDData);
    },
    onSuccess: () => {
      toast.success("Job converted to Reference JD successfully!");
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to convert job to reference JD";

      if (error.message) {
        errorMessage = error.message;
      }

      const apiError = error as Error & {
        data?: { detail?: string; message?: string };
      };
      if (apiError.data) {
        if (typeof apiError.data === "string") {
          errorMessage = apiError.data;
        } else if (apiError.data.detail) {
          errorMessage = apiError.data.detail;
        } else if (apiError.data.message) {
          errorMessage = apiError.data.message;
        }
      }

      toast.error(errorMessage);
      console.error("Error converting job to reference JD:", error);
      console.error("Error details:", {
        message: error.message,
        data: (error as any).data,
      });
    },
  });
}
