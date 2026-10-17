import type { Metadata } from 'next'

import { toApplySource, toRefToken } from '@/lib/publicApi'

import { JobPage, JobPostingJsonLd } from '@/components/public/jobs/JobPage'
import { loadJob } from '@/components/public/jobs/loadJob'
import { markdownToText } from '@/components/public/shared/Markdown'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ src?: string; ref?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { ref }] = await Promise.all([params, searchParams])
  const job = await loadJob(slug, toRefToken(ref))
  return {
    title: `${job.title} · ${job.company.name}`,
    description: markdownToText(job.description).slice(0, 160) || job.company.name,
  }
}

export default async function PublicJobRoute({ params, searchParams }: Props) {
  const [{ slug }, { src, ref }] = await Promise.all([params, searchParams])
  const refToken = toRefToken(ref)
  const job = await loadJob(slug, refToken)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return (
    <>
      <JobPostingJsonLd job={job} url={`${base}/jobs/${job.slug}`} />
      <JobPage
        job={job}
        source={toApplySource(src ?? (refToken ? 'referral' : undefined))}
        refToken={refToken}
      />
    </>
  )
}
