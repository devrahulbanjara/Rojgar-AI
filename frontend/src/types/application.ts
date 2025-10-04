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
  user_id: number;
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