import { Suspense } from 'react'

import type { Metadata } from 'next'

import { AuditView } from '@/components/screens/audit/AuditView'
import { AdminOnly } from '@/components/screens/shell/AdminOnly'

export const metadata: Metadata = { title: 'Audit log' }

export default function AuditPage() {
  return (
    <AdminOnly>
      <Suspense>
        <AuditView />
      </Suspense>
    </AdminOnly>
  )
}
