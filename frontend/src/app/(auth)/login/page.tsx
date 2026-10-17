import { Suspense } from 'react'

import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { LoginForm } from '@/components/public/auth/LoginForm'

export const metadata: Metadata = { title: `Log in · ${BRAND.name}` }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
