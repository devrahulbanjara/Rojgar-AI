/**
 * Profile Service
 * API calls for profile management (SSOT - Single Source of Truth)
 */

import { api } from '../lib/api';
import type {
  Profile,
  ProfileCreateRequest,
  ProfileUpdateRequest,
  WorkExperience,
  WorkExperienceCreateRequest,
  WorkExperienceUpdateRequest,
  EducationRecord,
  EducationCreateRequest,
  EducationUpdateRequest,
  Certification,
  CertificationCreateRequest,
  CertificationUpdateRequest,
  ProfileSkill,
  ProfileSkillCreateRequest,
  ProfileSkillUpdateRequest
} from '../types/profile';

export const profileService = {
  // Profile CRUD operations
  async getProfile(): Promise<Profile> {
    return api.profile.get();
  },

  async createProfile(profileData: ProfileCreateRequest): Promise<Profile> {
    return api.profile.create(profileData);
  },

  async updateProfile(profileData: ProfileUpdateRequest): Promise<Profile> {
    return api.profile.update(profileData);
  },

  // Work Experience management
  async getWorkExperiences(): Promise<WorkExperience[]> {
    const profile = await this.getProfile();
    return profile.work_experiences || [];
  },

  async createWorkExperience(experienceData: WorkExperienceCreateRequest): Promise<WorkExperience> {
    return api.profile.workExperience.create(experienceData);
  },

  async updateWorkExperience(id: string, experienceData: WorkExperienceUpdateRequest): Promise<WorkExperience> {
    return api.profile.workExperience.update(id, experienceData);
  },

  async deleteWorkExperience(id: string): Promise<void> {
    return api.profile.workExperience.delete(id);
  },

  // Education management
  async getEducationRecords(): Promise<EducationRecord[]> {
    const profile = await this.getProfile();
    return profile.education_records || [];
  },

  async createEducationRecord(educationData: EducationCreateRequest): Promise<EducationRecord> {
    return api.profile.education.create(educationData);
  },

  async updateEducationRecord(id: string, educationData: EducationUpdateRequest): Promise<EducationRecord> {
    return api.profile.education.update(id, educationData);
  },

  async deleteEducationRecord(id: string): Promise<void> {
    return api.profile.education.delete(id);
  },

  // Certification management
  async getCertifications(): Promise<Certification[]> {
    const profile = await this.getProfile();
    return profile.certifications || [];
  },

  async createCertification(certificationData: CertificationCreateRequest): Promise<Certification> {
    return api.profile.certifications.create(certificationData);
  },

  async updateCertification(id: string, certificationData: CertificationUpdateRequest): Promise<Certification> {
    return api.profile.certifications.update(id, certificationData);
  },

  async deleteCertification(id: string): Promise<void> {
    return api.profile.certifications.delete(id);
  },

  // Skills management
  async getProfileSkills(): Promise<ProfileSkill[]> {
    const profile = await this.getProfile();
    return profile.skills || [];
  },

  async createProfileSkill(skillData: ProfileSkillCreateRequest): Promise<ProfileSkill> {
    return api.profile.skills.create(skillData);
  },

  async updateProfileSkill(id: string, skillData: ProfileSkillUpdateRequest): Promise<ProfileSkill> {
    return api.profile.skills.update(id, skillData);
  },

  async deleteProfileSkill(id: string): Promise<void> {
    return api.profile.skills.delete(id);
  },
};
