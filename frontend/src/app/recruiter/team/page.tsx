import type { Metadata } from 'next'

import { AdminOnly } from '@/components/screens/shell/AdminOnly'
import { TeamView } from '@/components/screens/team/TeamView'

export const metadata: Metadata = { title: 'Team' }

export default function TeamPage() {
  return (
    <AdminOnly>
      <TeamView />
    </AdminOnly>
  )
}
