export interface SocialLinkBase {
  type: string;
  url: string;
}

export interface WorkExperienceBase {
  job_title: string;
  company: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current: boolean;
  description?: string | null;
}

export interface EducationBase {
  college_name: string;
  degree: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current: boolean;
}

export interface CertificationBase {
  certification_name: string;
  issuing_body: string;
  credential_url?: string | null;
  issue_date?: string | null;
  expiration_date?: string | null;
  does_not_expire: boolean;
}

export interface SkillBase {
  skill_name: string;
}

// --- Responses ---

export interface ResumeSocialLinkResponse extends SocialLinkBase {
  resume_social_link_id: string;
}

export interface ResumeWorkExperienceResponse extends WorkExperienceBase {
  resume_work_experience_id: string;
}

export interface ResumeEducationResponse extends EducationBase {
  resume_education_id: string;
}

export interface ResumeCertificationResponse extends CertificationBase {
  resume_certification_id: string;
}

export interface ResumeSkillResponse extends SkillBase {
  resume_skill_id: string;
}

export interface ResumeResponse {
  resume_id: string;
  profile_id: string;
  resume_name: string;
  target_job_title?: string | null;
  custom_summary?: string | null;
  created_at: string;
  updated_at: string;

  social_links: ResumeSocialLinkResponse[];
  work_experiences: ResumeWorkExperienceResponse[];
  educations: ResumeEducationResponse[];
  certifications: ResumeCertificationResponse[];
  skills: ResumeSkillResponse[];
}

export interface ResumeListResponse {
  resume_id: string;
  resume_name: string;
  target_job_title?: string | null;
  updated_at: string;
}

// --- Requests ---

export interface ResumeCreate {
  resume_name: string;
  target_job_title?: string | null;
  custom_summary?: string | null;

  // Optional Custom Data (if provided, overrides profile fetch)
  work_experiences?: WorkExperienceBase[] | null;
  educations?: EducationBase[] | null;
  certifications?: CertificationBase[] | null;
  skills?: SkillBase[] | null;
  social_links?: SocialLinkBase[] | null;
}

export interface ResumeUpdate {
  resume_name?: string | null;
  target_job_title?: string | null;
  custom_summary?: string | null;
}
