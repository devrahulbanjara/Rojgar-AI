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
    const response = await api.resumes.list();
    return response as Resume[];
  },

  async getResume(id: string): Promise<Resume> {
    const response = await api.resumes.get(id);
    return response as Resume;
  },

  async createResume(resumeData: ResumeCreateRequest): Promise<Resume> {
    const response = await api.resumes.create(resumeData);
    return response as Resume;
  },

  async updateResume(id: string, resumeData: ResumeUpdateRequest): Promise<Resume> {
    const response = await api.resumes.update(id, resumeData);
    return response as Resume;
  },

  async deleteResume(id: string): Promise<void> {
    await api.resumes.delete(id);
  },

  // Autofill data from profile
  async getAutofillData(): Promise<ResumeAutofillData> {
    const response = await api.resumes.getAutofillData();
    return response as ResumeAutofillData;
  },

  // Experience management for Resume
  async addExperienceToResume(resumeId: string, experienceData: AddExperienceToResumeRequest): Promise<any> {
    const response = await api.resumes.experiences.add(resumeId, experienceData);
    return response;
  },

  async updateExperienceInResume(resumeId: string, expId: string, experienceData: UpdateExperienceInResumeRequest): Promise<any> {
    const response = await api.resumes.experiences.update(resumeId, expId, experienceData);
    return response;
  },

  async removeExperienceFromResume(resumeId: string, expId: string): Promise<void> {
    await api.resumes.experiences.remove(resumeId, expId);
  },

  // Education management for Resume
  async addEducationToResume(resumeId: string, educationData: AddEducationToResumeRequest): Promise<any> {
    const response = await api.resumes.education.add(resumeId, educationData);
    return response;
  },

  async removeEducationFromResume(resumeId: string, eduId: string): Promise<void> {
    await api.resumes.education.remove(resumeId, eduId);
  },

  // Certification management for Resume
  async addCertificationToResume(resumeId: string, certificationData: AddCertificationToResumeRequest): Promise<any> {
    const response = await api.resumes.certifications.add(resumeId, certificationData);
    return response;
  },

  async removeCertificationFromResume(resumeId: string, certId: string): Promise<void> {
    await api.resumes.certifications.remove(resumeId, certId);
  },

  // Skills management for Resume
  async addSkillToResume(resumeId: string, skillData: AddSkillToResumeRequest): Promise<any> {
    const response = await api.resumes.skills.add(resumeId, skillData);
    return response;
  },

  async removeSkillFromResume(resumeId: string, skillId: string): Promise<void> {
    await api.resumes.skills.remove(resumeId, skillId);
  },
};
