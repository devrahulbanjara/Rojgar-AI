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
    const response = await api.profile.get();
    return response as Profile;
  },

  async createProfile(profileData: ProfileCreateRequest): Promise<Profile> {
    const response = await api.profile.create(profileData);
    return response as Profile;
  },

  async updateProfile(profileData: ProfileUpdateRequest): Promise<Profile> {
    const response = await api.profile.update(profileData);
    return response as Profile;
  },

  // Work Experience management
  async getWorkExperiences(): Promise<WorkExperience[]> {
    const profile = await this.getProfile();
    return profile.work_experiences || [];
  },

  async createWorkExperience(experienceData: WorkExperienceCreateRequest): Promise<WorkExperience> {
    const response = await api.profile.workExperience.create(experienceData);
    return response as WorkExperience;
  },

  async updateWorkExperience(id: string, experienceData: WorkExperienceUpdateRequest): Promise<WorkExperience> {
    const response = await api.profile.workExperience.update(id, experienceData);
    return response as WorkExperience;
  },

  async deleteWorkExperience(id: string): Promise<void> {
    await api.profile.workExperience.delete(id);
  },

  // Education management
  async getEducationRecords(): Promise<EducationRecord[]> {
    const profile = await this.getProfile();
    return profile.education_records || [];
  },

  async createEducationRecord(educationData: EducationCreateRequest): Promise<EducationRecord> {
    const response = await api.profile.education.create(educationData);
    return response as EducationRecord;
  },

  async updateEducationRecord(id: string, educationData: EducationUpdateRequest): Promise<EducationRecord> {
    const response = await api.profile.education.update(id, educationData);
    return response as EducationRecord;
  },

  async deleteEducationRecord(id: string): Promise<void> {
    await api.profile.education.delete(id);
  },

  // Certification management
  async getCertifications(): Promise<Certification[]> {
    const profile = await this.getProfile();
    return profile.certifications || [];
  },

  async createCertification(certificationData: CertificationCreateRequest): Promise<Certification> {
    const response = await api.profile.certifications.create(certificationData);
    return response as Certification;
  },

  async updateCertification(id: string, certificationData: CertificationUpdateRequest): Promise<Certification> {
    const response = await api.profile.certifications.update(id, certificationData);
    return response as Certification;
  },

  async deleteCertification(id: string): Promise<void> {
    await api.profile.certifications.delete(id);
  },

  // Skills management
  async getProfileSkills(): Promise<ProfileSkill[]> {
    const profile = await this.getProfile();
    return profile.skills || [];
  },

  async createProfileSkill(skillData: ProfileSkillCreateRequest): Promise<ProfileSkill> {
    const response = await api.profile.skills.create(skillData);
    return response as ProfileSkill;
  },

  async updateProfileSkill(id: string, skillData: ProfileSkillUpdateRequest): Promise<ProfileSkill> {
    const response = await api.profile.skills.update(id, skillData);
    return response as ProfileSkill;
  },

  async deleteProfileSkill(id: string): Promise<void> {
    await api.profile.skills.delete(id);
  },
};
