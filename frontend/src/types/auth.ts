/**
 * Authentication related types
 */

export type UserRole = 'recruiter' | 'candidate';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface RecruiterProfile extends User {
  role: 'recruiter';
  companyId: string;
  department: string;
  title: string;
}

export interface CandidateProfile extends User {
  role: 'candidate';
  currentRole: string;
  experience: number; // years
  skills: string[];
  resumeUrl?: string;
  preferredRoles: string[];
  preferredLocations: string[];
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: () => void;
}

export interface SignupData {
  email: string;
  password: string;
  role: UserRole;
  // Recruiter specific
  companyName?: string;
  teamSize?: CompanySize;
  industry?: string;
  // Candidate specific
  fullName?: string;
  currentRole?: string;
  experience?: number;
  skills?: string[];
}

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
