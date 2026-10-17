import type { Metadata } from 'next'

import { getT } from '@/lib/i18n/server'

import { LandingPage } from '@/components/public/landing/LandingPage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: { absolute: t.landing.metaTitle }, description: t.landing.metaDescription }
}

export default function Home() {
  return <LandingPage />
}
