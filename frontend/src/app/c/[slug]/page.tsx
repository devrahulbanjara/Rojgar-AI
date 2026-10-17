import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BRAND } from '@/lib/brand'
import { type CareersPage, PublicApiError, publicApi } from '@/lib/publicApi'

import { CareersView } from '@/components/public/careers/CareersView'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string): Promise<CareersPage> {
  try {
    return await publicApi.careers(slug)
  } catch (err) {
    if (err instanceof PublicApiError && err.status === 404) notFound()
    throw err
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { company } = await publicApi.careers(slug)
    return { title: `Jobs at ${company.name} · ${BRAND.name}` }
  } catch {
    return { title: BRAND.name }
  }
}

export default async function CareersRoute({ params }: Props) {
  const { slug } = await params
  return <CareersView page={await load(slug)} />
}
