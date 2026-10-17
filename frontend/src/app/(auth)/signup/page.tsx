import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { SignupForm } from '@/components/public/auth/SignupForm'

export const metadata: Metadata = { title: `Create your company account · ${BRAND.name}` }

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
