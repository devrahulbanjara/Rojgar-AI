import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { MagicLinkForm } from '@/components/public/auth/MagicLinkForm'

export const metadata: Metadata = { title: `Sign in · ${BRAND.name}` }

export default function Page() {
  return (
    <Suspense>
      <MagicLinkForm />
    </Suspense>
  )
}
