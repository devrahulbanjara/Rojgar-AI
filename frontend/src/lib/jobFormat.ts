import type { LocationType, PublicJobSummary } from '@/lib/publicApi'

const LOCATION_TYPE: Record<LocationType, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

export function locationTypeLabel(type: LocationType): string {
  return LOCATION_TYPE[type] ?? type
}

const fmt = (n: number) => n.toLocaleString('en-IN')

/** "NPR 120,000 – 180,000" · "From NPR 120,000" · null */
export function salaryLabel(job: Pick<PublicJobSummary, 'salary_min' | 'salary_max' | 'currency'>) {
  const { salary_min: min, salary_max: max, currency } = job
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${currency} ${fmt(min)}`
  if (max) return `Up to ${currency} ${fmt(max)}`
  return null
}

/** "Kathmandu · Hybrid" */
export function placeLabel(job: Pick<PublicJobSummary, 'location' | 'location_type'>) {
  return [job.location, locationTypeLabel(job.location_type)].filter(Boolean).join(' · ')
}
