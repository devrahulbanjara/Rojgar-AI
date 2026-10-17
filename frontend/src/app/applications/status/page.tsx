import type { Metadata } from 'next'

import { getT } from '@/lib/i18n/server'

import { StatusView } from '@/components/public/status/StatusView'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).status.title }
}

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ApplicationStatusPage({ searchParams }: Props) {
  const { token } = await searchParams
  return <StatusView token={token ?? null} />
}
