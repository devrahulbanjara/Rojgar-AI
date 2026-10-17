'use client'

import { Suspense } from 'react'

import { useParams } from 'next/navigation'

import { JobPage } from '@/components/screens/job/JobPage'
import { JobPageSkeleton } from '@/components/screens/job/skeletons'

export default function RecruiterJobPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <Suspense fallback={<JobPageSkeleton />}>
      <JobPage key={id} jobId={id} />
    </Suspense>
  )
}
