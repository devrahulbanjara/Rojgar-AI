import type { CandidateProfileData, UpdateProfileRequest } from '@/store/services/profileApi'

export type FormExperience = {
  /** Client-side stable key for list rendering. */
  _key: string
  title: string
  company_name: string
  /** "YYYY-MM" format used by <input type="month"> */
  startDate: string
  endDate: string
  /** When true, end_date is sent as null to the API. */
  current: boolean
  /** Multi-line text; each non-empty line becomes one item in description[]. */
  description: string
}

export type FormEducation = {
  _key: string
  institution: string
  degree: string
  field_of_study: string
  startDate: string
  endDate: string
}

export type FormProfile = {
  headline: string
  summary: string
  phone: string
  location: string
  linkedin_url: string
  github_url: string
  portfolio_url: string
  years_of_experience: string
  experiences: FormExperience[]
  educations: FormEducation[]
  skills: string[]
  target_roles: string[]
  is_open_to_work: boolean
}

export const SECTIONS = ['Overview', 'Experience', 'Education', 'Skills'] as const
export type Section = (typeof SECTIONS)[number]

export const EMPTY_FORM: FormProfile = {
  headline: '',
  summary: '',
  phone: '',
  location: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  years_of_experience: '',
  experiences: [],
  educations: [],
  skills: [],
  target_roles: [],
  is_open_to_work: false,
}

export function uid(): string {
  return Math.random().toString(36).slice(2)
}

/** "YYYY-MM-DD" → "YYYY-MM" suitable for <input type="month">. Null → "". */
export function parseApiDate(d: string | null | undefined): string {
  if (!d) return ''
  return d.slice(0, 7)
}

/** "YYYY-MM" → "YYYY-MM-01" for the API. Empty string → null. */
export function toApiDate(d: string): string | null {
  return d ? `${d}-01` : null
}

export function descToText(desc: string[]): string {
  return desc.join('\n')
}

export function textToDesc(text: string): string[] {
  return text.split('\n').filter((l) => l.trim().length > 0)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "YYYY-MM" → "Jan 2024" display label. "" → "Present". */
export function formatDate(value: string): string {
  if (!value) return 'Present'
  const [year, month] = value.split('-')
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`
}

export function apiToForm(data: CandidateProfileData): FormProfile {
  return {
    headline: data.headline ?? '',
    summary: data.summary ?? '',
    phone: data.phone ?? '',
    location: data.location ?? '',
    linkedin_url: data.linkedin_url ?? '',
    github_url: data.github_url ?? '',
    portfolio_url: data.portfolio_url ?? '',
    years_of_experience: data.years_of_experience?.toString() ?? '',
    experiences: data.experiences.map((e) => ({
      _key: e.id ?? uid(),
      title: e.title,
      company_name: e.company_name,
      startDate: parseApiDate(e.start_date),
      endDate: parseApiDate(e.end_date),
      current: !e.end_date,
      description: descToText(e.description),
    })),
    educations: data.educations.map((e) => ({
      _key: e.id ?? uid(),
      institution: e.institution,
      degree: e.degree ?? '',
      field_of_study: e.field_of_study ?? '',
      startDate: parseApiDate(e.start_date),
      endDate: parseApiDate(e.end_date),
    })),
    skills: data.skills.map((s) => s.skill_name),
    target_roles: data.target_roles || [],
    is_open_to_work: data.is_open_to_work ?? false,
  }
}

export function formToApiUpdate(form: FormProfile): UpdateProfileRequest {
  return {
    headline: form.headline || null,
    summary: form.summary || null,
    phone: form.phone || null,
    location: form.location || null,
    linkedin_url: form.linkedin_url || null,
    github_url: form.github_url || null,
    portfolio_url: form.portfolio_url || null,
    years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience, 10) : null,
    is_open_to_work: form.is_open_to_work,
    experiences: form.experiences.map((e) => ({
      company_name: e.company_name,
      title: e.title,
      start_date: toApiDate(e.startDate),
      end_date: e.current ? null : toApiDate(e.endDate),
      description: textToDesc(e.description),
    })),
    educations: form.educations.map((e) => ({
      institution: e.institution,
      degree: e.degree || null,
      field_of_study: e.field_of_study || null,
      start_date: toApiDate(e.startDate),
      end_date: toApiDate(e.endDate),
    })),
    skills: form.skills.map((s) => ({ skill_name: s })),
    target_roles: form.target_roles,
  }
}

export const AVAILABLE_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Fullstack Engineer',
  'Web Developer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'Game Developer',
  'Embedded Systems Engineer',
  'Firmware Engineer',
  'API Developer',
  'Salesforce Developer',
  'CMS Developer (WordPress, Shopify, etc.)',
  'DevOps Engineer',
  'Cloud Architect',
  'Cloud Engineer',
  'Site Reliability Engineer (SRE)',
  'Platform Engineer',
  'Network Engineer',
  'Network Administrator',
  'Systems Administrator',
  'Database Administrator (DBA)',
  'Infrastructure Engineer',
  'Release Manager',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Data Analyst',
  'Business Intelligence (BI) Developer',
  'Big Data Engineer',
  'Deep Learning Engineer',
  'NLP Engineer',
  'Computer Vision Engineer',
  'Prompt Engineer',
  'Data Architect',
  'Security Engineer',
  'Cybersecurity Analyst',
  'Penetration Tester (Ethical Hacker)',
  'Security Architect',
  'DevSecOps Engineer',
  'Information Security Manager',
  'Incident Responder',
  'Cryptographer',
  'QA Tester',
  'QA Engineer',
  'QA Automation Engineer',
  'Software Development Engineer in Test (SDET)',
  'Performance Tester',
  'Manual Tester',
  'UI/UX Designer',
  'Product Designer',
  'UX Researcher',
  'Interaction Designer',
  'Visual Designer',
  'Web Designer',
  'Product Manager',
  'Project Manager',
  'Scrum Master',
  'Product Owner',
  'Technical Program Manager (TPM)',
  'Engineering Manager',
  'Business Analyst',
  'Blockchain Developer',
  'Smart Contract Engineer',
  'Web3 Developer',
  'AR/VR Developer',
  'IoT Engineer',
  'Robotics Engineer',
  'RPA Developer (Robotic Process Automation)',
  'Developer Advocate / Evangelist',
  'Sales Engineer',
  'Solutions Architect',
  'Technical Writer',
  'Implementation Consultant',
  'IT Support Specialist',
  'Helpdesk Technician',
  'IT Manager / Director',
  'Chief Technology Officer (CTO)',
  'Chief Information Officer (CIO)',
  'Chief Information Security Officer (CISO)',
]
