import type { Metadata } from 'next'

import { BusinessesView } from '@/components/screens/admin/BusinessesView'

export const metadata: Metadata = { title: 'Businesses' }

export default function Page() {
  return <BusinessesView />
}
