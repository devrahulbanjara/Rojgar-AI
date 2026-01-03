import { apiClient } from '../lib/api';
import type { Skill, SkillCreateRequest, SkillsListResponse } from '../types/skill';

export const skillService = {
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
};
