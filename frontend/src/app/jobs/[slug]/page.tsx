import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BRAND } from '@/lib/brand'
import { PublicApiError, type PublicJob, publicApi, toApplySource } from '@/lib/publicApi'

import { JobPage, JobPostingJsonLd } from '@/components/public/jobs/JobPage'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ src?: string }>
}

async function loadJob(slug: string): Promise<PublicJob> {
  try {
    return await publicApi.job(slug)
  } catch (err) {
    if (err instanceof PublicApiError && err.status === 404) notFound()
    throw err
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const job = await publicApi.job(slug)
    return {
      title: `${job.title} at ${job.company.name} · ${BRAND.name}`,
      description: job.overview?.slice(0, 160) ?? `Apply for ${job.title} at ${job.company.name}.`,
    }
  } catch {
    return { title: BRAND.name }
  }
}

export default async function PublicJobRoute({ params, searchParams }: Props) {
  const [{ slug }, { src }] = await Promise.all([params, searchParams])
  const job = await loadJob(slug)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return (
    <>
      <JobPostingJsonLd job={job} url={`${base}/jobs/${job.slug}`} />
      <JobPage job={job} source={toApplySource(src)} />
    </>
  )
}
