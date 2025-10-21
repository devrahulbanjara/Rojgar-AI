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
    const response = await apiClient.get<SkillsListResponse>('/skills/');
    return response.data || response as SkillsListResponse;
  },

  async createSkill(skillData: SkillCreateRequest): Promise<Skill> {
    const response = await apiClient.post<Skill>('/skills/', skillData);
    return response.data || response as Skill;
  },


  async deleteSkill(skillId: string): Promise<void> {
    await apiClient.delete(`/skills/${skillId}`);
  },

  async deleteAllSkills(): Promise<void> {
    await apiClient.delete('/skills/');
  },

  // Profile management
  async updateProfile(profileData: ProfileUpdateRequest): Promise<void> {
    await apiClient.put('/users/profile', profileData);
  },

  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    await apiClient.put('/users/password', passwordData);
  }
};
