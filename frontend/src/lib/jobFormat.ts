import type { Dict } from '@/lib/i18n'
import type { PublicJobSummary } from '@/lib/publicApi'
import { differenceInCalendarDays } from 'date-fns'

const fmt = (n: number) => n.toLocaleString('en-IN')

/** "NPR 25,000 – 35,000 / month" · "From रु 25,000 / महिना" · null */
export function salaryLabel(
  job: Pick<PublicJobSummary, 'salary_min' | 'salary_max' | 'currency'>,
  t: Dict,
): string | null {
  const { salary_min: min, salary_max: max } = job
  const currency = job.currency === 'NPR' ? t.job.npr : job.currency
  const amount =
    min && max
      ? `${currency} ${fmt(min)} – ${fmt(max)}`
      : min
        ? t.job.from(`${currency} ${fmt(min)}`)
        : max
          ? t.job.upTo(`${currency} ${fmt(max)}`)
          : null
  return amount ? `${amount} ${t.job.perMonth}` : null
}

/** "Pokhara · On-site" */
export function placeLabel(job: Pick<PublicJobSummary, 'location' | 'location_type'>, t: Dict) {
  return [job.location, t.job[job.location_type]].filter(Boolean).join(' · ')
}

/** "Closes in 5 days" · null when there is no closing date. */
export function closingLabel(iso: string | null | undefined, t: Dict): string | null {
  if (!iso) return null
  const days = differenceInCalendarDays(new Date(iso), new Date())
  if (days < 0) return t.job.closed
  if (days === 0) return t.job.closesToday
  if (days === 1) return t.job.closesTomorrow
  return t.job.closesIn(days)
}

/** Place · full time · salary · closing, for a job's one-line facts. */
export function jobFacts(job: PublicJobSummary, t: Dict): string[] {
  return [
    placeLabel(job, t),
    t.job[job.employment_type],
    salaryLabel(job, t),
    closingLabel(job.closes_at, t),
  ].filter((fact): fact is string => !!fact)
}
