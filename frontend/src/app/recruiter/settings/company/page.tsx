import type { Metadata } from 'next'

import { CompanySettings } from '@/components/screens/settings/CompanySettings'
import { AdminOnly } from '@/components/screens/shell/AdminOnly'

export const metadata: Metadata = { title: 'Company' }

export default function CompanySettingsPage() {
  return (
    <AdminOnly>
      <CompanySettings />
    </AdminOnly>
  )
}
