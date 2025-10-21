/**
 * Skill Types
 * Type definitions for candidate skills
 */

export interface Skill {
  id: string;
  user_id: string;
  skill: string;
  created_at: string;
  updated_at: string;
}

export interface SkillCreateRequest {
  skill: string;
}

export interface SkillsListResponse {
  skills: Skill[];
  total: number;
}

export interface ProfileUpdateRequest {
  name: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
