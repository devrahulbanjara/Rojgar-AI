import { Suspense } from 'react'

import type { Metadata } from 'next'

import { CandidatesView } from '@/components/screens/candidates/CandidatesView'

export const metadata: Metadata = { title: 'Applicants' }

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesView />
    </Suspense>
  )
}
