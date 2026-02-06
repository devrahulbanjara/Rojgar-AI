import { api } from '../lib/api'
import type {
  CandidateProfile,
  CandidateProfileUpdate,
  WorkExperienceCreate,
  WorkExperienceUpdate,
  EducationCreate,
  EducationUpdate,
  SkillCreate,
  SkillUpdate,
  CertificationCreate,
  CertificationUpdate,
} from '../types/profile'

export const profileService = {
  async getProfile(): Promise<CandidateProfile> {
    const data = await api.candidate.getProfile()
    return data as CandidateProfile
  },

  async updateProfile(data: CandidateProfileUpdate): Promise<CandidateProfile> {
    const response = await api.candidate.updateProfile(data)
    return response as CandidateProfile
  },

  async addExperience(data: WorkExperienceCreate) {
    return api.candidate.experience.add(data)
  },

  async deleteExperience(id: string) {
    return api.candidate.experience.delete(id)
  },

  async updateExperience(id: string, data: WorkExperienceUpdate) {
    return api.candidate.experience.update(id, data)
  },

  async addEducation(data: EducationCreate) {
    return api.candidate.education.add(data)
  },

  async deleteEducation(id: string) {
    return api.candidate.education.delete(id)
  },

  async updateEducation(id: string, data: EducationUpdate) {
    return api.candidate.education.update(id, data)
  },

  async addSkill(data: SkillCreate) {
    return api.candidate.skills.add(data)
  },

  async deleteSkill(id: string) {
    return api.candidate.skills.delete(id)
  },

  async updateSkill(id: string, data: SkillUpdate) {
    return api.candidate.skills.update(id, data)
  },

  async addCertification(data: CertificationCreate) {
    return api.candidate.certifications.add(data)
  },

  async deleteCertification(id: string) {
    return api.candidate.certifications.delete(id)
  },

  async updateCertification(id: string, data: CertificationUpdate) {
    return api.candidate.certifications.update(id, data)
  },

  async addSocialLink(data: { type: string; url: string }) {
    return api.candidate.socialLinks.add(data)
  },

  async deleteSocialLink(id: string) {
    return api.candidate.socialLinks.delete(id)
  },

  async updateSocialLink(id: string, data: { type: string; url: string }) {
    return api.candidate.socialLinks.update(id, data)
  },
}
