import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { ResetPasswordForm } from '@/components/public/auth/ResetPasswordForm'

export const metadata: Metadata = { title: `Choose a new password · ${BRAND.name}` }

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
