import Link from 'next/link'

import { getT } from '@/lib/i18n/server'
import type { PublicJob } from '@/lib/publicApi'

import { SuggestForm } from './SuggestForm'

export async function SuggestView({ job, refToken }: { job: PublicJob; refToken?: string }) {
  const t = await getT()
  return (
    <div className="bg-background px-4 pt-8 pb-16 sm:pt-14">
      <div className="mx-auto w-full max-w-[440px] rounded-2xl border bg-card p-5 sm:p-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {t.suggest.title}
        </h1>
        <Link
          href={`/jobs/${job.slug}`}
          className="mt-1 block text-sm text-muted-foreground hover:underline"
        >
          {t.suggest.forJob(job.title, job.company.name)}
        </Link>
        <div className="mt-6">
          <SuggestForm slug={job.slug} companyName={job.company.name} refToken={refToken} />
        </div>
      </div>
    </div>
  )
}
