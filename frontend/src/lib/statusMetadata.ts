export type ApplicationLifecycleStatus =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview_booked'
  | 'interview_completed'
  | 'offer'
  | 'rejected'

export type JobLifecycleStatus = 'draft' | 'active' | 'expired'

type StatusMetadata = {
  label: string
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'
}

const APPLICATION_STATUS_METADATA: Record<ApplicationLifecycleStatus, StatusMetadata> = {
  applied: { label: 'Applied', variant: 'gray' },
  screening: { label: 'Screening', variant: 'warning' },
  shortlisted: { label: 'Shortlisted', variant: 'secondary' },
  interview_booked: { label: 'Interview Booked', variant: 'primary' },
  interview_completed: { label: 'Interview Completed', variant: 'primary' },
  offer: { label: 'Offer', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

const JOB_STATUS_METADATA: Record<JobLifecycleStatus, StatusMetadata> = {
  draft: { label: 'Draft', variant: 'gray' },
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'secondary' },
}

export function getApplicationStatusLabel(status: ApplicationLifecycleStatus): string {
  return APPLICATION_STATUS_METADATA[status].label
}

export function getApplicationStatusVariant(
  status: ApplicationLifecycleStatus,
): StatusMetadata['variant'] {
  return APPLICATION_STATUS_METADATA[status].variant
}

export function getJobStatusLabel(status: JobLifecycleStatus): string {
  return JOB_STATUS_METADATA[status].label
}

export function getJobStatusVariant(status: JobLifecycleStatus): StatusMetadata['variant'] {
  return JOB_STATUS_METADATA[status].variant
}

export function getApplicationStatusOrder(status: ApplicationLifecycleStatus): number {
  switch (status) {
    case 'applied':
      return 0
    case 'screening':
      return 1
    case 'shortlisted':
      return 2
    case 'interview_booked':
      return 3
    case 'interview_completed':
      return 4
    case 'offer':
      return 5
    case 'rejected':
      return 6
    default:
      return 0
  }
}
