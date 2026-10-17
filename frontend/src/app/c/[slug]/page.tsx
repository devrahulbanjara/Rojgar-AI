import { cache } from 'react'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { type CareersPage, PublicApiError, publicApi } from '@/lib/publicApi'

import { CareersView } from '@/components/public/careers/CareersView'

type Props = { params: Promise<{ slug: string }> }

const load = cache(async (slug: string): Promise<CareersPage> => {
  try {
    return await publicApi.careers(slug)
  } catch (err) {
    if (err instanceof PublicApiError && err.status === 404) notFound()
    throw err
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await load((await params).slug)
  return { title: company.name, description: company.description?.slice(0, 160) }
}

export default async function CareersRoute({ params }: Props) {
  return <CareersView page={await load((await params).slug)} />
}
