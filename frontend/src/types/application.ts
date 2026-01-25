export const ApplicationStage = {
  APPLIED: "applied",
  SCREENING: "screening",
  INTERVIEWING: "interviewing",
  OFFER: "offer",
  DECISION: "decision"
} as const;

export type ApplicationStage = typeof ApplicationStage[keyof typeof ApplicationStage];

export const ApplicationStatus = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  OFFER_EXTENDED: "offer_extended",
  ACCEPTED: "accepted",
  REJECTED: "rejected"
} as const;

export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];

export interface Application {
  id: number;
  job_title: string;
  company_name: string;
  user_id: string;
  applied_date: string;
  stage: ApplicationStage;
  status: ApplicationStatus;
  description?: string;
  updated_at: string;
}

export interface ApplicationTrackingBoard {
  applied: Application[];
  interviewing: Application[];
  outcome: Application[];
}

// Application Form Types
export interface CreateApplicationRequest {
  job_id: string;
  resume_id: string;
  cover_letter?: string;
}

export interface UpdateApplicationRequest {
  id: string;
  status?: ApplicationStatus;
  notes?: string;
  feedback?: string;
  interviewDate?: Date;
}

// Application Hook Return Types
export interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createApplication: (data: CreateApplicationRequest) => Promise<void>;
  updateApplication: (data: UpdateApplicationRequest) => Promise<void>;
}
