export type ShareSource = 'direct' | 'linkedin' | 'facebook' | 'merojob'

export interface ShareableJob {
  slug: string
  title: string
  companyName: string
  location?: string | null
  locationType?: 'remote' | 'onsite' | 'hybrid' | null
}

const LOCATION_TYPE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' } as const

/** Public apply link, tagged with where it was shared. */
export function applyUrl(slug: string, src: ShareSource, origin = currentOrigin()): string {
  return `${origin}/jobs/${encodeURIComponent(slug)}?src=${src}`
}

function currentOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin
}

function where(job: ShareableJob): string {
  const type = job.locationType ? LOCATION_TYPE_LABEL[job.locationType] : null
  return [type, job.location].filter(Boolean).join(', ')
}

export function linkedInPost(job: ShareableJob): string {
  const place = where(job)
  return [
    `We're hiring a ${job.title} at ${job.companyName}${place ? ` (${place})` : ''}.`,
    '',
    'Apply in a couple of minutes, no account needed:',
    applyUrl(job.slug, 'linkedin'),
    '',
    '#hiring #nepal',
  ].join('\n')
}

export function facebookPost(job: ShareableJob): string {
  const place = where(job)
  return [
    `${job.companyName} is hiring: ${job.title}${place ? ` · ${place}` : ''}`,
    `Apply here: ${applyUrl(job.slug, 'facebook')}`,
  ].join('\n')
}
