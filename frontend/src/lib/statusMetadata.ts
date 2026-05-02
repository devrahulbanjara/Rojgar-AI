export type ApplicationLifecycleStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_booked'
  | 'interview_completed'
  | 'offer'
  | 'offer_accepted'
  | 'offer_declined'
  | 'rejected'

export type JobLifecycleStatus = 'draft' | 'active' | 'expired'

type StatusMetadata = {
  label: string
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray'
}

const APPLICATION_STATUS_METADATA: Record<ApplicationLifecycleStatus, StatusMetadata> = {
  applied: { label: 'Applied', variant: 'gray' },
  shortlisted: { label: 'Shortlisted', variant: 'secondary' },
  interview_booked: { label: 'Interview Booked', variant: 'primary' },
  interview_completed: { label: 'Interview Completed', variant: 'primary' },
  offer: { label: 'Offer', variant: 'success' },
  offer_accepted: { label: 'Offer Accepted', variant: 'success' },
  offer_declined: { label: 'Offer Declined', variant: 'danger' },
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

export function getAllRecruiterSelectableStatuses(
  current: ApplicationLifecycleStatus,
): ApplicationLifecycleStatus[] {
  return (Object.keys(APPLICATION_STATUS_METADATA) as ApplicationLifecycleStatus[]).filter(
    (status) => status !== current,
  )
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
    case 'shortlisted':
      return 1
    case 'interview_booked':
      return 2
    case 'interview_completed':
      return 3
    case 'offer':
      return 4
    case 'offer_accepted':
      return 5
    case 'offer_declined':
      return 5
    case 'rejected':
      return 6
    default:
      return 0
  }
}
