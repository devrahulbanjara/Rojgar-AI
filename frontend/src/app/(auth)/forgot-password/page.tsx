import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { ForgotPasswordForm } from '@/components/public/auth/ForgotPasswordForm'

export const metadata: Metadata = { title: `Reset your password · ${BRAND.name}` }

export default function Page() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
