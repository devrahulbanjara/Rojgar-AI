export interface SocialLink {
  social_link_id: string
  type: string
  url: string
}

export interface WorkExperience {
  candidate_work_experience_id: string
  job_title: string
  company: string
  location?: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
}

export interface Education {
  candidate_education_id: string
  college_name: string
  degree: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
}

export interface Certification {
  candidate_certification_id: string
  certification_name: string
  issuing_body: string
  credential_id?: string
  credential_url?: string
  issue_date?: string
  expiration_date?: string
  does_not_expire: boolean
}

export interface Skill {
  candidate_skill_id: string
  skill_name: string
}

export interface CandidateProfile {
  profile_id: string
  user_id: string

  full_name: string
  email: string
  picture?: string

  phone?: string
  location_city?: string
  location_country?: string
  professional_headline?: string
  professional_summary?: string

  social_links: SocialLink[]
  work_experiences: WorkExperience[]
  educations: Education[]
  certifications: Certification[]
  skills: Skill[]
}

export interface CandidateProfileUpdate {
  full_name?: string
  phone?: string
  location_city?: string
  location_country?: string
  professional_headline?: string
  professional_summary?: string

  // Nested collections for state synchronization
  social_links?: SocialLinkSync[]
  work_experiences?: WorkExperienceSync[]
  educations?: EducationSync[]
  certifications?: CertificationSync[]
  skills?: SkillSync[]
}

// Sync types: ID is optional (present = update, absent = create)
export interface SocialLinkSync {
  social_link_id?: string
  type: string
  url: string
}

export interface WorkExperienceSync {
  candidate_work_experience_id?: string
  job_title: string
  company: string
  location?: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
}

export interface EducationSync {
  candidate_education_id?: string
  college_name: string
  degree: string
  location?: string
  start_date?: string
  end_date?: string
  is_current: boolean
}

export interface CertificationSync {
  candidate_certification_id?: string
  certification_name: string
  issuing_body: string
  credential_id?: string
  credential_url?: string
  issue_date?: string
  expiration_date?: string
  does_not_expire: boolean
}

export interface SkillSync {
  candidate_skill_id?: string
  skill_name: string
}

// Legacy aliases for backward compatibility with existing component forms
export type SocialLinkCreate = SocialLinkSync
export type WorkExperienceCreate = WorkExperienceSync
export type EducationCreate = EducationSync
export type CertificationCreate = CertificationSync
export type SkillCreate = SkillSync
export type WorkExperienceUpdate = Partial<WorkExperienceSync>
export type EducationUpdate = Partial<EducationSync>
export type CertificationUpdate = Partial<CertificationSync>
export type SkillUpdate = Partial<SkillSync>
