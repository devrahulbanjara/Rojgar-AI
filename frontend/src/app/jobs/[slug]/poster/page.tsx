import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { getT } from '@/lib/i18n/server'

import { PosterView } from '@/components/public/jobs/PosterView'
import { loadJob } from '@/components/public/jobs/loadJob'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [job, t] = await Promise.all([loadJob((await params).slug), getT()])
  return { title: `${t.common.poster} · ${job.title}`, robots: { index: false } }
}

export default async function PosterRoute({ params }: Props) {
  const [{ slug }, headerStore] = await Promise.all([params, headers()])
  const job = await loadJob(slug)
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') ?? 'http'
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`
  return <PosterView job={job} applyUrl={`${origin}/jobs/${job.slug}?src=qr`} />
}
