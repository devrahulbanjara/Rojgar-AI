import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { VerifyEmailView } from '@/components/public/auth/VerifyEmailView'

export const metadata: Metadata = { title: `Verify your email · ${BRAND.name}` }

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailView />
    </Suspense>
  )
}
