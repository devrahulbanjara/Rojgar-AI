import { Suspense } from 'react'

import { InsightsView } from '@/components/screens/insights/InsightsView'

export default function RecruiterInsightsPage() {
  return (
    <Suspense>
      <InsightsView />
    </Suspense>
  )
}
