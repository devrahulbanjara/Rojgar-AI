import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { StatusView } from '@/components/public/status/StatusView'

export const metadata: Metadata = { title: `Your application · ${BRAND.name}` }

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ApplicationStatusPage({ searchParams }: Props) {
  const { token } = await searchParams
  return <StatusView token={token ?? null} />
}
