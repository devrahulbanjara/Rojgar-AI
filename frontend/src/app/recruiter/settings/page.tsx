import type { Metadata } from 'next'

import { ProfileSettings } from '@/components/screens/settings/ProfileSettings'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return <ProfileSettings />
}
