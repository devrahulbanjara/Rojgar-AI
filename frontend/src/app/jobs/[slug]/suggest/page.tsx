import type { Metadata } from 'next'

import { getT } from '@/lib/i18n/server'

import { SuggestView } from '@/components/public/jobs/SuggestView'
import { loadJob } from '@/components/public/jobs/loadJob'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [job, t] = await Promise.all([loadJob((await params).slug), getT()])
  return { title: `${t.suggest.title} · ${job.title}`, robots: { index: false } }
}

export default async function SuggestRoute({ params, searchParams }: Props) {
  const [{ slug }, { ref }] = await Promise.all([params, searchParams])
  return <SuggestView job={await loadJob(slug)} refToken={ref?.slice(0, 64) || undefined} />
}
