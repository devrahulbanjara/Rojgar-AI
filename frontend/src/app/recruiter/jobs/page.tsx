import { Suspense } from 'react'

import { JobsView } from '@/components/screens/jobs/JobsView'

export default function RecruiterJobsPage() {
  return (
    <Suspense>
      <JobsView />
    </Suspense>
  )
}
