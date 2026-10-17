import type { Metadata } from 'next'

import { getT } from '@/lib/i18n/server'
import { toRefToken } from '@/lib/publicApi'

import { SuggestView } from '@/components/public/jobs/SuggestView'
import { loadJob } from '@/components/public/jobs/loadJob'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { ref }, t] = await Promise.all([params, searchParams, getT()])
  const job = await loadJob(slug, toRefToken(ref))
  return { title: `${t.suggest.title} · ${job.title}`, robots: { index: false } }
}

export default async function SuggestRoute({ params, searchParams }: Props) {
  const [{ slug }, { ref }] = await Promise.all([params, searchParams])
  const refToken = toRefToken(ref)
  return <SuggestView job={await loadJob(slug, refToken)} refToken={refToken} />
}
