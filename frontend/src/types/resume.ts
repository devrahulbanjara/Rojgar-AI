/**
 * Resume Types - Tailored views of Profile data
 * Type definitions for resume customization and management
 */

export interface Resume {
  id: string;
  profile_id: string;
  name: string;
  target_job_title?: string;
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_location?: string;
  custom_summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
  
  // Nested data
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  certifications: ResumeCertification[];
  skills: ResumeSkill[];
}

export interface ResumeExperience {
  id: string;
  resume_id: string;
  work_experience_id: string;
  custom_description: string;
  created_at: string;
  updated_at: string;
  
  // Resume-specific overrides (don't affect original work experience)
  job_title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  master_description?: string;
  
  // Related work experience data
  work_experience: {
    id: string;
    job_title: string;
    company: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    master_description: string;
  };
}

export interface ResumeEducation {
  id: string;
  resume_id: string;
  education_record_id: string;
  created_at: string;
  updated_at: string;
  
  // Resume-specific overrides (don't affect original education record)
  school_university?: string;
  degree?: string;
  field_of_study?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  gpa?: string;
  honors?: string;
  
  // Related education data
  education_record: {
    id: string;
    school_university: string;
    degree: string;
    field_of_study: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current: boolean;
    gpa?: string;
    honors?: string;
  };
}

export interface ResumeCertification {
  id: string;
  resume_id: string;
  certification_id: string;
  created_at: string;
  updated_at: string;
  
  // Resume-specific overrides (don't affect original certification)
  name?: string;
  issuing_body?: string;
  credential_id?: string;
  credential_url?: string;
  issue_date?: string;
  expiration_date?: string;
  does_not_expire?: boolean;
  
  // Related certification data
  certification: {
    id: string;
    name: string;
    issuing_body: string;
    credential_id?: string;
    credential_url?: string;
    issue_date?: string;
    expiration_date?: string;
    does_not_expire: boolean;
  };
}

export interface ResumeSkill {
  id: string;
  resume_id: string;
  profile_skill_id: string;
  created_at: string;
  updated_at: string;
  
  // Resume-specific overrides (don't affect original profile skill)
  skill_name?: string;
  proficiency_level?: string;
  years_of_experience?: number;
  
  // Related skill data
  profile_skill: {
    id: string;
    skill_name: string;
    proficiency_level: string;
    years_of_experience?: number;
  };
}

// Request types for Resume operations
export interface ResumeCreateRequest {
  name: string;
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_location?: string;
  custom_summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface ResumeUpdateRequest {
  name?: string;
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_location?: string;
  custom_summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface AddExperienceToResumeRequest {
  work_experience_id: string;
  custom_description: string;
}

export interface UpdateExperienceInResumeRequest {
  custom_description: string;
}

export interface AddEducationToResumeRequest {
  education_record_id: string;
}

export interface AddCertificationToResumeRequest {
  certification_id: string;
}

export interface AddSkillToResumeRequest {
  profile_skill_id: string;
}
