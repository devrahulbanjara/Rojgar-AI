/**
 * TypeScript Type Definitions
 * Centralized type definitions for type safety and better IDE support
 */

// User Types
export type UserType = 'recruiter' | 'candidate';

export interface User {
  id: string;
  name: string;
  email: string;
  userType?: UserType; // For compatibility
  role?: UserType; // Backend uses 'role'
  picture?: string; // For Google OAuth profile pictures
  createdAt?: string;
  updatedAt?: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Form Types
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select';
  placeholder?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
}

export interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Component Props Types
export interface PageProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AuthPageProps extends PageProps {
  title: string;
  subtitle?: string;
  redirectTo?: string;
}

// Hook Return Types
export interface UseFormReturn {
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (name: string, value: string) => void;
  handleSubmit: (onSubmit: (values: Record<string, string>) => Promise<void>) => (e: React.FormEvent) => void;
  reset: () => void;
  setFieldError: (name: string, error: string) => void;
}

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  // Additional error states for granular control
  loginError?: any;
  signupError?: any;
  logoutError?: any;
  isLoginPending?: boolean;
  isSignupPending?: boolean;
  isLogoutPending?: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ detail: any }>;
  meta?: Record<string, any>;
}

// Dashboard Types (for future expansion)
export interface DashboardStats {
  totalApplications?: number;
  activeJobs?: number;
  interviewsScheduled?: number;
  responseRate?: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  recentActivity: any[];
}

// Re-export job and application types
export * from './job';
export * from './application';
