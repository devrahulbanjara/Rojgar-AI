export type UserType = "recruiter" | "candidate" | "organization";

export interface User {
  id: string;
  name: string;
  email: string;
  userType?: UserType;
  role?: UserType;
  picture?: string;
  organization_id?: string;
  organization?: {
    id: string;
    name: string;
    location_city?: string;
    location_country?: string;
    website?: string;
    industry?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  email: string;
  name: string;
  location_city?: string;
  location_country?: string;
  website?: string;
  description?: string;
  industry?: string;
  founded_year?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationSignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  locationCity?: string;
  locationCountry?: string;
}

export interface OrganizationAuthResponse {
  organization: Organization;
  token: string;
}

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

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "password" | "select";
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

export interface PageProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AuthPageProps extends PageProps {
  title: string;
  subtitle?: string;
  redirectTo?: string;
}

export interface UseFormReturn {
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (name: string, value: string) => void;
  handleSubmit: (
    onSubmit: (values: Record<string, string>) => Promise<void>,
  ) => (e: React.FormEvent) => void;
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
  refetchUser?: () => void;
  loginError?: unknown;
  signupError?: unknown;
  logoutError?: unknown;
  isLoginPending?: boolean;
  isSignupPending?: boolean;
  isLogoutPending?: boolean;
}

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ detail: unknown }>;
  meta?: Record<string, unknown>;
}

export type DirectApiResponse<T = unknown> = T;

export interface DashboardStats {
  totalApplications?: number;
  activeJobs?: number;
  activeApplications?: number;
  interviewsScheduled?: number;
  offersReceived?: number;
  responseRate?: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  recentActivity: unknown[];
}

export * from "./job";
export * from "./application";

export * from "./profile";
export * from "./resume";
