// =============================================================================
// User Schema Types
// Matches the unified backend response envelope pattern.
// All field names use snake_case to mirror the API contract.
// =============================================================================

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type PrimaryRole = 'candidate' | 'recruiter_admin' | 'recruiter'

export type MembershipStatus = 'active' | 'pending' | 'rejected'

export interface RecruiterMember {
  membership_id: string
  user_id: string
  full_name: string
  email: string
  avatar_url: string | null
  status: MembershipStatus
  joined_at: string
}

export type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'rejected'
  | 'hired'

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote' | 'hybrid'

export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive'

// ---------------------------------------------------------------------------
// Base User (returned by /auth/me and embedded in login response)
// ---------------------------------------------------------------------------

export interface BaseUser {
  id: string
  full_name: string
  email: string
  primary_role: PrimaryRole
  is_email_verified: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
  /** Only present for recruiter users: their CompanyMembership approval status. */
  membership_status?: MembershipStatus
}

// ---------------------------------------------------------------------------
// Candidate profile
// ---------------------------------------------------------------------------

export interface WorkExperience {
  id: string
  job_title: string
  company_name: string
  location: string | null
  is_current: boolean
  start_date: string // ISO date "YYYY-MM"
  end_date: string | null // null when is_current = true
  description: string | null
}

export interface Education {
  id: string
  institution: string
  degree: string
  field_of_study: string | null
  grade: string | null
  is_current: boolean
  start_date: string // ISO date "YYYY-MM"
  end_date: string | null
  description: string | null
}

export interface CertificationOrAward {
  id: string
  title: string
  issuer: string | null
  issued_date: string | null
  expiry_date: string | null
  credential_url: string | null
}

export interface SocialLinks {
  linkedin: string | null
  github: string | null
  portfolio: string | null
  twitter: string | null
  other: string | null
}

export interface Resume {
  id: string
  file_url: string
  filename: string
  file_size_bytes: number
  mime_type: string
  is_primary: boolean
  uploaded_at: string
}

export interface CandidateProfile extends BaseUser {
  primary_role: 'candidate'
  phone: string | null
  location: string | null
  headline: string | null // e.g. "Frontend Engineer @ Convex"
  bio: string | null
  skills: string[] // ["React", "TypeScript", ...]
  experience_level: ExperienceLevel | null
  expected_salary: string | null
  preferred_job_types: JobType[]
  is_open_to_work: boolean
  social_links: SocialLinks
  work_experiences: WorkExperience[]
  educations: Education[]
  certifications: CertificationOrAward[]
  resumes: Resume[]
  primary_resume: Resume | null
}

// Update request — all fields optional
export type UpdateCandidateProfileRequest = Partial<
  Pick<
    CandidateProfile,
    | 'full_name'
    | 'phone'
    | 'location'
    | 'headline'
    | 'bio'
    | 'skills'
    | 'experience_level'
    | 'expected_salary'
    | 'preferred_job_types'
    | 'is_open_to_work'
    | 'social_links'
  >
>

// ---------------------------------------------------------------------------
// Company profile
// ---------------------------------------------------------------------------

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5000+'

export interface CompanyProfile {
  id: string
  slug: string
  name: string
  logo_url: string | null
  cover_image_url: string | null
  website: string | null
  industry: string | null
  company_size: CompanySize | null
  location: string | null
  founded_year: number | null
  description: string | null
  mission: string | null
  social_links: SocialLinks
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type UpdateCompanyProfileRequest = Partial<
  Pick<
    CompanyProfile,
    | 'name'
    | 'logo_url'
    | 'cover_image_url'
    | 'website'
    | 'industry'
    | 'company_size'
    | 'location'
    | 'founded_year'
    | 'description'
    | 'mission'
    | 'social_links'
  >
>

// ---------------------------------------------------------------------------
// Recruiter profile
// ---------------------------------------------------------------------------

export interface RecruiterProfile extends BaseUser {
  primary_role: 'recruiter'
  phone: string | null
  designation: string | null // e.g. "Senior Recruiter"
  company: Pick<CompanyProfile, 'id' | 'slug' | 'name' | 'logo_url' | 'industry' | 'location'>
  total_jobs_posted: number
  total_hires: number
}

export type UpdateRecruiterProfileRequest = Partial<
  Pick<RecruiterProfile, 'full_name' | 'phone' | 'designation'>
>

// ---------------------------------------------------------------------------
// Job listing
// ---------------------------------------------------------------------------

export interface JobListing {
  id: string
  title: string
  company: Pick<CompanyProfile, 'id' | 'slug' | 'name' | 'logo_url' | 'location'>
  posted_by: Pick<BaseUser, 'id' | 'full_name' | 'avatar_url'>
  location: string
  is_remote: boolean
  job_type: JobType
  experience_level: ExperienceLevel | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  description: string
  requirements: string[]
  skills_required: string[]
  status: 'draft' | 'active' | 'paused' | 'closed'
  applications_count: number
  views_count: number
  posted_at: string
  expires_at: string | null
  updated_at: string
}

export type CreateJobRequest = Pick<
  JobListing,
  | 'title'
  | 'location'
  | 'is_remote'
  | 'job_type'
  | 'description'
  | 'requirements'
  | 'skills_required'
> &
  Partial<
    Pick<
      JobListing,
      'experience_level' | 'salary_min' | 'salary_max' | 'salary_currency' | 'expires_at'
    >
  >

export type UpdateJobRequest = Partial<CreateJobRequest & { status: JobListing['status'] }>

// ---------------------------------------------------------------------------
// Job application
// ---------------------------------------------------------------------------

export interface JobApplication {
  id: string
  job: Pick<JobListing, 'id' | 'title' | 'job_type' | 'location' | 'is_remote'> & {
    company: Pick<CompanyProfile, 'id' | 'name' | 'logo_url'>
  }
  candidate: Pick<
    CandidateProfile,
    'id' | 'full_name' | 'email' | 'avatar_url' | 'headline' | 'location'
  >
  resume: Resume | null
  cover_letter: string | null
  status: ApplicationStatus
  rejection_reason: string | null
  applied_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Interview (recruiter-specific)
// ---------------------------------------------------------------------------

export type InterviewType = 'online' | 'in_person' | 'phone'
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled'

export interface InterviewSchedule {
  id: string
  application_id: string
  candidate_name: string
  job_title: string
  scheduled_at: string
  duration_minutes: number
  type: InterviewType
  meeting_link: string | null
  notes: string | null
  status: InterviewStatus
}

export interface ScheduleInterviewRequest {
  application_id: string
  scheduled_at: string
  duration_minutes: number
  type: InterviewType
  meeting_link?: string
  notes?: string
}

// ---------------------------------------------------------------------------
// Pagination wrapper
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
