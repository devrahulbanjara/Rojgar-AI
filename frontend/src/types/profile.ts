/**
 * Profile Types - Single Source of Truth (SSOT)
 * Matches Backend Schemas from app/schemas/candidate.py
 */

// --- Sub-Resources ---

export interface SocialLink {
  social_link_id: string;
  type: string;
  url: string;
}

export interface WorkExperience {
  candidate_work_experience_id: string;
  job_title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

export interface Education {
  candidate_education_id: string;
  college_name: string;
  degree: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
}

export interface Certification {
  candidate_certification_id: string;
  certification_name: string;
  issuing_body: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire: boolean;
}

export interface Skill {
  candidate_skill_id: string;
  skill_name: string;
}

// --- Main Profile Response ---

export interface CandidateProfile {
  profile_id: string;
  user_id: string;

  // User Fields
  full_name: string;
  email: string;
  picture?: string;

  // Profile Fields
  phone?: string;
  location_city?: string;
  location_country?: string;
  professional_headline?: string;
  professional_summary?: string;

  // Lists
  social_links: SocialLink[];
  work_experiences: WorkExperience[];
  educations: Education[];
  certifications: Certification[];
  skills: Skill[];
}

// --- Inputs (Create/Update) ---

export interface CandidateProfileUpdate {
  full_name?: string;
  phone?: string;
  location_city?: string;
  location_country?: string;
  professional_headline?: string;
  professional_summary?: string;
}

export interface SocialLinkCreate {
  type: string;
  url: string;
}

export interface WorkExperienceCreate {
  job_title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

export type WorkExperienceUpdate = Partial<WorkExperienceCreate>;

export interface EducationCreate {
  college_name: string;
  degree: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
}

export type EducationUpdate = Partial<EducationCreate>;

export interface CertificationCreate {
  certification_name: string;
  issuing_body: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire: boolean;
}

export type CertificationUpdate = Partial<CertificationCreate>;

export interface SkillCreate {
  skill_name: string;
}

export type SkillUpdate = Partial<SkillCreate>;
