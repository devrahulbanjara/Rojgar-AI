import type { Metadata } from 'next'

import { InterviewsView } from '@/components/screens/interviews/InterviewsView'

export const metadata: Metadata = { title: 'Interviews' }

export default function InterviewsPage() {
  return <InterviewsView />
}
