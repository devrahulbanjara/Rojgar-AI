import { Suspense } from 'react'

import type { Metadata } from 'next'

import AuthGuard from '@/components/common/AuthGuard'
import { StartBusiness } from '@/components/screens/business/StartBusiness'

export const metadata: Metadata = { title: 'Create your business' }

export default function StartPage() {
  return (
    <AuthGuard access="person">
      <Suspense>
        <StartBusiness />
      </Suspense>
    </AuthGuard>
  )
}
