import type {
  EmploymentType,
  JobCategory,
  JobDetail,
  JobListItem,
  LocationType,
} from '@/store/services/jobsApi'

/** cvRequired mirrors CV_REQUIRED_CATEGORIES in backend/app/shared/enums.py. */
export const JOB_CATEGORIES: { value: JobCategory; label: string; cvRequired: boolean }[] = [
  { value: 'banking_finance', label: 'Banking & Finance', cvRequired: true },
  { value: 'healthcare', label: 'Healthcare', cvRequired: true },
  { value: 'education', label: 'Education', cvRequired: true },
  { value: 'hospitality_tourism', label: 'Hospitality & Tourism', cvRequired: false },
  { value: 'sales_retail', label: 'Sales & Retail', cvRequired: false },
  { value: 'manufacturing', label: 'Manufacturing', cvRequired: false },
  { value: 'logistics_driving', label: 'Logistics & Driving', cvRequired: false },
  { value: 'it_software', label: 'IT & Software', cvRequired: true },
  { value: 'ngo_ingo', label: 'NGO/INGO', cvRequired: true },
  { value: 'government_public', label: 'Government & Public', cvRequired: true },
  { value: 'office_admin', label: 'Office & Admin', cvRequired: true },
  { value: 'construction_engineering', label: 'Construction & Engineering', cvRequired: false },
  { value: 'other', label: 'Other', cvRequired: false },
]

/** Whether a new job in this category asks for a CV (no category counts as Other). */
export const cvRequiredFor = (category: JobCategory | null) =>
  JOB_CATEGORIES.find((c) => c.value === (category ?? 'other'))?.cvRequired ?? false

/** Questions on the apply form: 3 with a CV, 5 without (backend MAX_QUESTIONS*). */
export const maxQuestions = (cvRequired: boolean) => (cvRequired ? 3 : 5)

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
