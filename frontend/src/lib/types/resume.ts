// =============================================================================
// Resume UI Types
// Shared between the resume page components and the Redux resume slice.
// =============================================================================

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string; // "YYYY-MM" for <input type="month">
  endDate: string; // "YYYY-MM" or "" when current
  current: boolean;
  description: string; // newline-separated bullet points
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string; // "YYYY-MM"
  endDate: string; // "YYYY-MM"
  gpa: string;
}

export interface Resume {
  id: string;
  name: string; // resume_name from API
  updatedAt: string; // human-readable date
  targetRole: string; // headline used as target role label
  fullName: string; // from auth user
  headline: string;
  email: string; // from auth user
  phone: string;
  location: string;
  website: string; // portfolio_url or linkedin_url
  linkedin_url: string;
  github_url: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
}
