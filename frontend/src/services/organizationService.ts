import { apiClient } from "../lib/api";

export interface Recruiter {
  id: string;
  email: string;
  name: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecruiterRequest {
  email: string;
  name: string;
  password: string;
}

export interface UpdateRecruiterRequest {
  email?: string;
  name?: string;
  password?: string;
}

const organizationEndpoints = {
  recruiters: {
    list: "/api/v1/organization/recruiters",
    detail: (id: string) => `/api/v1/organization/recruiters/${id}`,
    create: "/api/v1/organization/recruiters",
    update: (id: string) => `/api/v1/organization/recruiters/${id}`,
    delete: (id: string) => `/api/v1/organization/recruiters/${id}`,
  },
} as const;

export class OrganizationService {
  /**
   * Get all recruiters for the authenticated organization
   */
  static async getRecruiters(): Promise<Recruiter[]> {
    return apiClient.get<Recruiter[]>(organizationEndpoints.recruiters.list);
  }

  /**
   * Get a specific recruiter by ID
   */
  static async getRecruiterById(id: string): Promise<Recruiter> {
    return apiClient.get<Recruiter>(organizationEndpoints.recruiters.detail(id));
  }

  /**
   * Create a new recruiter
   */
  static async createRecruiter(
    data: CreateRecruiterRequest,
  ): Promise<Recruiter> {
    return apiClient.post<Recruiter>(
      organizationEndpoints.recruiters.create,
      data,
    );
  }

  /**
   * Update a recruiter
   */
  static async updateRecruiter(
    id: string,
    data: UpdateRecruiterRequest,
  ): Promise<Recruiter> {
    return apiClient.put<Recruiter>(
      organizationEndpoints.recruiters.update(id),
      data,
    );
  }

  /**
   * Delete a recruiter
   */
  static async deleteRecruiter(id: string): Promise<void> {
    return apiClient.delete<void>(organizationEndpoints.recruiters.delete(id));
  }
}
