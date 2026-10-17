import type { Metadata } from 'next'

import { AvailabilitySettings } from '@/components/screens/settings/AvailabilitySettings'

export const metadata: Metadata = { title: 'Availability' }

export default function AvailabilityPage() {
  return <AvailabilitySettings />
}
