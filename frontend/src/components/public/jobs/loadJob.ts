import { cache } from 'react'

import { notFound } from 'next/navigation'

import { PublicApiError, type PublicJob, publicApi } from '@/lib/publicApi'

/** One fetch per request for a job's page, metadata, poster and suggest page; 404 when closed. */
export const loadJob = cache(async (slug: string): Promise<PublicJob> => {
  try {
    return await publicApi.job(slug)
  } catch (err) {
    if (err instanceof PublicApiError && err.status === 404) notFound()
    throw err
  }
})
