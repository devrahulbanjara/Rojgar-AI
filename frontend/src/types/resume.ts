export interface SocialLink {
  resume_social_link_id: string
  type: string
  url: string
}

export interface WorkExperience {
  resume_work_experience_id: string
  job_title: string
  company: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  description?: string
}

export interface Education {
  resume_education_id: string
  college_name: string
  degree: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
}

export interface Certification {
  resume_certification_id: string
  certification_name: string
  issuing_body: string
  credential_id?: string
  credential_url?: string
  issue_date?: string
  expiration_date?: string
  does_not_expire: boolean
}

export interface Skill {
  resume_skill_id: string
  skill_name: string
}

export interface ResumeDetail {
  resume_id: string
  profile_id: string
  target_job_title?: string
  custom_summary?: string
  created_at: string
  updated_at: string
  social_links: SocialLink[]
  work_experiences: WorkExperience[]
  educations: Education[]
  certifications: Certification[]
  skills: Skill[]
}

// List item for resume listings (lighter weight)
export interface ResumeListItem {
  resume_id: string
  profile_id?: string
  target_job_title?: string
  custom_summary?: string
  created_at?: string
  updated_at: string
}

// Create/Update types for resume operations
export interface ResumeCreate {
  target_job_title?: string
  custom_summary?: string
  social_links?: SocialLinkCreate[]
  work_experiences?: WorkExperienceCreate[]
  educations?: EducationCreate[]
  certifications?: CertificationCreate[]
  skills?: SkillCreate[]
}

export interface ResumeUpdate {
  target_job_title?: string
  custom_summary?: string
  social_links?: SocialLinkCreate[]
  work_experiences?: WorkExperienceCreate[]
  educations?: EducationCreate[]
  certifications?: CertificationCreate[]
  skills?: SkillCreate[]
}

export interface ResumeResponse extends ResumeDetail {}

// For backward compatibility - getAllResumes returns an array of list items
export type ResumeListResponse = ResumeListItem

export interface ResumeWorkExperienceResponse extends WorkExperience {}

// Create types (without IDs)
export interface SocialLinkCreate {
  type: string
  url: string
}

export interface WorkExperienceCreate {
  job_title: string
  company: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  description?: string
}

export interface EducationCreate {
  college_name: string
  degree: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
}

export interface CertificationCreate {
  certification_name: string
  issuing_body: string
  credential_id?: string
  credential_url?: string
  issue_date?: string
  expiration_date?: string
  does_not_expire: boolean
}

export interface SkillCreate {
  skill_name: string
}

// Base types for compatibility
export type WorkExperienceBase = WorkExperienceCreate
