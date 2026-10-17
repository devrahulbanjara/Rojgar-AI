import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { LandingPage } from '@/components/public/landing/LandingPage'

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    'One apply link for every job post. Every CV is read and ranked, and you decide in one click.',
}

export default function Home() {
  return <LandingPage />
}
