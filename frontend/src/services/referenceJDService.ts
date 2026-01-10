import { apiClient } from "../lib/api";

export interface ReferenceJD {
  id: string;
  role_overview: string;
  requiredSkillsAndExperience: string[];
  niceToHave: string[];
  benefits: string[];
  about_the_company?: string | null;
  department?: string | null;
}

export interface CreateReferenceJDRequest {
  role_overview: string;
  requiredSkillsAndExperience: string[];
  niceToHave: string[];
  benefits: string[];
  department?: string;
}

export interface ReferenceJDListResponse {
  reference_jds: ReferenceJD[];
  about_the_company?: string | null;
}

const referenceJDEndpoints = {
  list: "/api/v1/jobs/reference-jd",
  detail: (id: string) => `/api/v1/jobs/reference-jd/${id}`,
  create: "/api/v1/jobs/reference-jd",
} as const;

export class ReferenceJDService {
  /**
   * Get all reference JDs for the authenticated user's organization
   */
  static async getReferenceJDs(): Promise<ReferenceJDListResponse> {
    return apiClient.get<ReferenceJDListResponse>(referenceJDEndpoints.list);
  }

  /**
   * Get a specific reference JD by ID
   */
  static async getReferenceJDById(id: string): Promise<ReferenceJD> {
    return apiClient.get<ReferenceJD>(referenceJDEndpoints.detail(id));
  }

  /**
   * Create a new reference JD
   */
  static async createReferenceJD(
    data: CreateReferenceJDRequest,
  ): Promise<ReferenceJD> {
    return apiClient.post<ReferenceJD>(referenceJDEndpoints.create, data);
  }

  /**
   * Convert a job to a reference JD request format
   */
  static convertJobToReferenceJD(job: {
    description?: string;
    role_overview?: string;
    required_skills_and_experience?: string[];
    requiredSkillsAndExperience?: string[];
    nice_to_have?: string[];
    niceToHave?: string[];
    benefits?: string[];
    department?: string;
  }): CreateReferenceJDRequest {
    return {
      role_overview: job.description || job.role_overview || "",
      requiredSkillsAndExperience:
        job.required_skills_and_experience ||
        job.requiredSkillsAndExperience ||
        [],
      niceToHave: job.nice_to_have || job.niceToHave || [],
      benefits: job.benefits || [],
      department: job.department,
    };
  }
}

export const referenceJDService = ReferenceJDService;
