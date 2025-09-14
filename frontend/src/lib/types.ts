/**
 * Type definitions for lib
 * Re-exports from types for lib compatibility
 */

// Re-export all types from the main types directory
export * from '@/types';

// Specific re-exports for commonly used types
export type { 
  User, 
  UserRole, 
  CompanySize, 
  CandidateProfile, 
  RecruiterProfile,
  SignupData,
  AuthState 
} from '@/types/auth';

export type { 
  Job, 
  Company, 
  Applicant, 
  Application, 
  JobLevel, 
  LocationType, 
  EmploymentType, 
  JobStatus, 
  ApplicationStatus 
} from '@/types/job';

export type { 
  DashboardStats, 
  Activity, 
  QuickAction 
} from '@/types/dashboard';
