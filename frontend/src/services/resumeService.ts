/**
 * Resume Service
 * API calls for resume management (Tailored views of Profile data)
 */

import { api } from '../lib/api';
import type {
  Resume,
  ResumeCreateRequest,
  ResumeUpdateRequest,
  AddExperienceToResumeRequest,
  UpdateExperienceInResumeRequest,
  AddEducationToResumeRequest,
  AddCertificationToResumeRequest,
  AddSkillToResumeRequest
} from '../types/resume';

export interface ResumeAutofillData {
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_location?: string;
  professional_summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  work_experiences: WorkExperienceAutofill[];
  education_records: EducationAutofill[];
  certifications: CertificationAutofill[];
  skills: SkillAutofill[];
}

export interface WorkExperienceAutofill {
  id: string;
  job_title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  master_description: string;
}

export interface EducationAutofill {
  id: string;
  school_university: string;
  degree: string;
  field_of_study?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  gpa?: string;
  honors?: string;
}

export interface CertificationAutofill {
  id: string;
  name: string;
  issuing_body: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire: boolean;
}

export interface SkillAutofill {
  id: string;
  skill_name: string;
  proficiency_level: string;
  years_of_experience?: string;
}

export const resumeService = {
  // Resume CRUD operations
  async getResumes(): Promise<Resume[]> {
    return api.resumes.list();
  },

  async getResume(id: string): Promise<Resume> {
    return api.resumes.get(id);
  },

  async createResume(resumeData: ResumeCreateRequest): Promise<Resume> {
    return api.resumes.create(resumeData);
  },

  async updateResume(id: string, resumeData: ResumeUpdateRequest): Promise<Resume> {
    return api.resumes.update(id, resumeData);
  },

  async deleteResume(id: string): Promise<void> {
    return api.resumes.delete(id);
  },

  // Autofill data from profile
  async getAutofillData(): Promise<ResumeAutofillData> {
    return api.resumes.getAutofillData();
  },

  // Experience management for Resume
  async addExperienceToResume(resumeId: string, experienceData: AddExperienceToResumeRequest): Promise<any> {
    return api.resumes.experiences.add(resumeId, experienceData);
  },

  async updateExperienceInResume(resumeId: string, expId: string, experienceData: UpdateExperienceInResumeRequest): Promise<any> {
    return api.resumes.experiences.update(resumeId, expId, experienceData);
  },

  async removeExperienceFromResume(resumeId: string, expId: string): Promise<void> {
    return api.resumes.experiences.remove(resumeId, expId);
  },

  // Education management for Resume
  async addEducationToResume(resumeId: string, educationData: AddEducationToResumeRequest): Promise<any> {
    return api.resumes.education.add(resumeId, educationData);
  },

  async updateEducationInResume(resumeId: string, eduId: string, educationData: any): Promise<any> {
    return api.resumes.education.update(resumeId, eduId, educationData);
  },

  async removeEducationFromResume(resumeId: string, eduId: string): Promise<void> {
    return api.resumes.education.remove(resumeId, eduId);
  },

  // Certification management for Resume
  async addCertificationToResume(resumeId: string, certificationData: AddCertificationToResumeRequest): Promise<any> {
    return api.resumes.certifications.add(resumeId, certificationData);
  },

  async updateCertificationInResume(resumeId: string, certId: string, certificationData: any): Promise<any> {
    return api.resumes.certifications.update(resumeId, certId, certificationData);
  },

  async removeCertificationFromResume(resumeId: string, certId: string): Promise<void> {
    return api.resumes.certifications.remove(resumeId, certId);
  },

  // Skills management for Resume
  async addSkillToResume(resumeId: string, skillData: AddSkillToResumeRequest): Promise<any> {
    return api.resumes.skills.add(resumeId, skillData);
  },

  async updateSkillInResume(resumeId: string, skillId: string, skillData: any): Promise<any> {
    return api.resumes.skills.update(resumeId, skillId, skillData);
  },

  async removeSkillFromResume(resumeId: string, skillId: string): Promise<void> {
    return api.resumes.skills.remove(resumeId, skillId);
  },

  // Resume-specific section creation (don't affect profile)
  async createExperienceForResume(resumeId: string, experienceData: any): Promise<any> {
    return api.resumes.experiences.create(resumeId, experienceData);
  },

  async createEducationForResume(resumeId: string, educationData: any): Promise<any> {
    return api.resumes.education.create(resumeId, educationData);
  },

  async createCertificationForResume(resumeId: string, certificationData: any): Promise<any> {
    return api.resumes.certifications.create(resumeId, certificationData);
  },

  async createSkillForResume(resumeId: string, skillData: any): Promise<any> {
    return api.resumes.skills.create(resumeId, skillData);
  },
};
