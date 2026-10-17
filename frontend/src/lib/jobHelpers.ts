import type {
  EmploymentType,
  JobCategory,
  JobDetail,
  JobListItem,
  LocationType,
} from '@/store/services/jobsApi'

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'banking_finance', label: 'Banking & Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality_tourism', label: 'Hospitality & Tourism' },
  { value: 'sales_retail', label: 'Sales & Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'logistics_driving', label: 'Logistics & Driving' },
  { value: 'it_software', label: 'IT & Software' },
  { value: 'ngo_ingo', label: 'NGO/INGO' },
  { value: 'government_public', label: 'Government & Public' },
  { value: 'office_admin', label: 'Office & Admin' },
  { value: 'construction_engineering', label: 'Construction & Engineering' },
  { value: 'other', label: 'Other' },
]

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

export const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

export const locationTypeLabel = (value: LocationType) =>
  LOCATION_TYPES.find((t) => t.value === value)?.label ?? value

/** "NPR 145,000 – 215,000" · "From NPR 30,000" · null */
export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = 'NPR',
): string | null {
  if (!min && !max) return null
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  if (min) return `From ${currency} ${min.toLocaleString()}`
  return `Up to ${currency} ${max!.toLocaleString()}`
}

/** One line of facts for a job: "Kathmandu · Hybrid · NPR 145,000 – 215,000". */
export function jobFacts(
  job: Pick<JobDetail, 'location' | 'location_type' | 'salary_min' | 'salary_max' | 'currency'>,
): (string | null)[] {
  return [
    job.location,
    locationTypeLabel(job.location_type),
    formatSalary(job.salary_min, job.salary_max, job.currency),
  ]
}

/** Open · Draft · Closed · Filled (closed because someone was hired). */
export function jobStatusLabel(job: Pick<JobListItem, 'status' | 'closed_reason'>): string {
  if (job.status === 'open') return 'Open'
  if (job.status === 'draft') return 'Draft'
  return job.closed_reason === 'hired' ? 'Filled' : 'Closed'
}
