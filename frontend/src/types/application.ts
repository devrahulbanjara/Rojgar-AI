export const ApplicationStatusEnum = {
  APPLIED: 'applied',
  INTERVIEWING: 'interviewing',
  OUTCOME: 'outcome',
} as const
export type ApplicationStatus = (typeof ApplicationStatusEnum)[keyof typeof ApplicationStatusEnum]

export const ApplicationStageEnum = ApplicationStatusEnum
export type ApplicationStage = ApplicationStatus

export interface Application {
  id: number
  job_title: string
  company_name: string
  user_id: string
  applied_date: string
  stage: ApplicationStage
  status: ApplicationStatus
  description?: string
  updated_at: string
}

export interface ApplicationTrackingBoard {
  applied: Application[]
  interviewing: Application[]
  outcome: Application[]
}

export interface CreateApplicationRequest {
  job_id: string
  resume_id: string
  cover_letter?: string
}

export interface UpdateApplicationRequest {
  id: string
  status?: ApplicationStatus
  notes?: string
  feedback?: string
  interviewDate?: Date
}

export interface UseApplicationsReturn {
  applications: Application[]
  loading: boolean
  error: string | null
  refetch: () => void
  createApplication: (data: CreateApplicationRequest) => Promise<void>
  updateApplication: (data: UpdateApplicationRequest) => Promise<void>
}
