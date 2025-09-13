/**
 * Job and application related types
 */

import { CompanySize } from './auth';

export interface Company {
  id: string;
  name: string;
  logo?: string;
  website: string;
  size: CompanySize;
  industry: string;
  headquarters: string;
  about: string;
  benefits: string[];
  brandColor?: string;
}

export interface Job {
  id: string;
  companyId: string;
  company?: Company;
  title: string;
  department: string;
  level: JobLevel;
  location: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  skills: string[];
  postedDate: Date;
  status: JobStatus;
  applicantCount?: number;
}

export type JobLevel = 'Intern' | 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
export type LocationType = 'Remote' | 'Hybrid' | 'On-site';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
export type JobStatus = 'Draft' | 'Active' | 'Paused' | 'Closed';

export type ApplicationStatus = 
  | 'Applied' 
  | 'In Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Offer Extended'
  | 'Offer Accepted'
  | 'Hired'
  | 'Rejected'
  | 'Withdrawn';

export interface Applicant {
  id: string;
  candidateId: string;
  candidate?: import('./auth').CandidateProfile;
  jobId: string;
  job?: Job;
  matchScore: number;
  matchExplanation: string[];
  keySkills: string[];
  experience: number;
  status: ApplicationStatus;
  appliedDate: Date;
  lastUpdated: Date;
  feedback?: string[];
  interviewDate?: Date;
  notes?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  job?: Job;
  status: ApplicationStatus;
  appliedDate: Date;
  lastUpdated: Date;
  feedback?: string[];
  coverLetter?: string;
  matchScore?: number;
}
