/**
 * Skills Service
 * API calls for skills management
 */

import { apiClient } from '../lib/api';
import type { 
  Skill, 
  SkillCreateRequest, 
  SkillsListResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest 
} from '../types/skill';

export const skillService = {
  // Skills CRUD operations
  async getSkills(): Promise<SkillsListResponse> {
    return apiClient.get<SkillsListResponse>('/skills/');
  },

  async createSkill(skillData: SkillCreateRequest): Promise<Skill> {
    return apiClient.post<Skill>('/skills/', skillData);
  },


  async deleteSkill(skillId: string): Promise<void> {
    return apiClient.delete(`/skills/${skillId}`);
  },

  async deleteAllSkills(): Promise<void> {
    return apiClient.delete('/skills/');
  },

  // Profile management
  async updateProfile(profileData: ProfileUpdateRequest): Promise<void> {
    return apiClient.put('/api/v1/users/profile', profileData);
  },

  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    return apiClient.put('/api/v1/users/password', passwordData);
  }
};
