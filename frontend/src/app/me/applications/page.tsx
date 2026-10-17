import type { Metadata } from 'next'

import { BRAND } from '@/lib/brand'

import { MyApplications } from '@/components/me/MyApplications'

export const metadata: Metadata = { title: `My applications · ${BRAND.name}` }

export default function MyApplicationsPage() {
  return <MyApplications />
}
