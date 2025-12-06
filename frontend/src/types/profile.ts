/**
 * Profile Types - Single Source of Truth (SSOT)
 * Type definitions for the master profile data
 */

export interface Profile {
  id: string;
  user_id: string;
  phone?: string;
  location_city?: string;
  location_country?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  professional_headline?: string;
  professional_summary?: string;
  created_at: string;
  updated_at: string;

  // User data (from user table)
  user_name?: string;
  user_email?: string;
  user_picture?: string;

  // Nested data
  work_experiences: WorkExperience[];
  education_records: EducationRecord[];
  certifications: Certification[];
  skills: ProfileSkill[];
}

export interface WorkExperience {
  id: string;
  profile_id: string;
  job_title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  master_description: string;
  created_at: string;
  updated_at: string;
}

export interface EducationRecord {
  id: string;
  profile_id: string;
  school_university: string;
  degree: string;
  field_of_study: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  gpa?: string;
  honors?: string;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  profile_id: string;
  name: string;
  issuing_body: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileSkill {
  id: string;
  profile_id: string;
  skill_name: string;
  proficiency_level: string;
  years_of_experience?: number;
  created_at: string;
  updated_at: string;
}

// Request types for Profile operations
export interface ProfileCreateRequest {
  // User table fields (will update user table)
  name?: string;
  email?: string;
  picture?: string;

  // Profile table fields (will update profile table)
  phone?: string;
  location_city?: string;
  location_country?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  professional_headline?: string;
  professional_summary?: string;
}

export interface ProfileUpdateRequest {
  // User table fields (will update user table)
  name?: string;
  email?: string;
  picture?: string;

  // Profile table fields (will update profile table)
  phone?: string;
  location_city?: string;
  location_country?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  professional_headline?: string;
  professional_summary?: string;
}

export interface WorkExperienceCreateRequest {
  job_title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  master_description: string;
}

export interface WorkExperienceUpdateRequest {
  job_title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  master_description?: string;
}

export interface EducationCreateRequest {
  school_university: string;
  degree: string;
  field_of_study: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  gpa?: string;
  honors?: string;
}

export interface EducationUpdateRequest {
  school_university?: string;
  degree?: string;
  field_of_study?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  gpa?: string;
  honors?: string;
}

export interface CertificationCreateRequest {
  name: string;
  issuing_body: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire: boolean;
}

export interface CertificationUpdateRequest {
  name?: string;
  issuing_body?: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire?: boolean;
}

export interface ProfileSkillCreateRequest {
  skill_name: string;
  proficiency_level: string;
  years_of_experience?: number;
}

export interface ProfileSkillUpdateRequest {
  skill_name?: string;
  proficiency_level?: string;
  years_of_experience?: number;
}
