import type { Metadata } from 'next'

import { toApplySource } from '@/lib/publicApi'

import { JobPage, JobPostingJsonLd } from '@/components/public/jobs/JobPage'
import { loadJob } from '@/components/public/jobs/loadJob'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ src?: string; ref?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await loadJob((await params).slug)
  return {
    title: `${job.title} · ${job.company.name}`,
    description: job.overview?.slice(0, 160) ?? `${job.title} · ${job.company.name}`,
  }
}

export default async function PublicJobRoute({ params, searchParams }: Props) {
  const [{ slug }, { src, ref }] = await Promise.all([params, searchParams])
  const job = await loadJob(slug)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return (
    <>
      <JobPostingJsonLd job={job} url={`${base}/jobs/${job.slug}`} />
      <JobPage job={job} source={toApplySource(src)} refToken={ref?.slice(0, 64) || undefined} />
    </>
  )
}
