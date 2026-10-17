import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { SignupForm } from '@/components/public/auth/SignupForm'

export const metadata: Metadata = { title: `Start hiring · ${BRAND.name}` }

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
