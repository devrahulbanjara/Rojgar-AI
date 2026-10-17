import type { Metadata } from 'next'

import { AdminFrame } from '@/components/screens/shell/AppFrame'

export const metadata: Metadata = { robots: { index: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>
}
