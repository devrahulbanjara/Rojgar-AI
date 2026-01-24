import { apiClient } from "../lib/api";

export interface ReferenceJD {
  id: string;
  // New backend fields
  job_summary?: string;
  job_responsibilities?: string[];
  required_qualifications?: string[];
  preferred?: string[];
  compensation_and_benefits?: string[];
  // Legacy fields (for backward compatibility)
  role_overview?: string;
  requiredSkillsAndExperience?: string[];
  niceToHave?: string[];
  benefits?: string[];
  about_the_company?: string | null;
  department?: string | null;
}

export interface CreateReferenceJDRequest {
  job_summary: string;
  job_responsibilities: string[];
  required_qualifications: string[];
  preferred: string[];
  compensation_and_benefits: string[];
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
  update: (id: string) => `/api/v1/jobs/reference-jd/${id}`,
  delete: (id: string) => `/api/v1/jobs/reference-jd/${id}`,
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
   * Update an existing reference JD
   */
  static async updateReferenceJD(
    id: string,
    data: CreateReferenceJDRequest,
  ): Promise<ReferenceJD> {
    return apiClient.put<ReferenceJD>(referenceJDEndpoints.update(id), data);
  }

  /**
   * Delete a reference JD by ID
   */
  static async deleteReferenceJD(id: string): Promise<void> {
    return apiClient.delete<void>(referenceJDEndpoints.delete(id));
  }

  /**
   * Convert a job to a reference JD request format
   */
  static convertJobToReferenceJD(job: {
    description?: string;
    job_summary?: string;
    role_overview?: string;
    job_responsibilities?: string[];
    required_qualifications?: string[];
    required_skills_and_experience?: string[];
    requiredSkillsAndExperience?: string[];
    preferred?: string[];
    nice_to_have?: string[];
    niceToHave?: string[];
    compensation_and_benefits?: string[];
    benefits?: string[];
    department?: string;
  }): CreateReferenceJDRequest {
    return {
      job_summary: job.job_summary || job.description || job.role_overview || "",
      job_responsibilities: job.job_responsibilities || [],
      required_qualifications:
        job.required_qualifications ||
        job.required_skills_and_experience ||
        job.requiredSkillsAndExperience ||
        [],
      preferred: job.preferred || job.nice_to_have || job.niceToHave || [],
      compensation_and_benefits: job.compensation_and_benefits || job.benefits || [],
      department: job.department,
    };
  }
}

export const referenceJDService = ReferenceJDService;
