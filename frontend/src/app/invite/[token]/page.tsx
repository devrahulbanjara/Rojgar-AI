import type { Metadata } from 'next'

import { JoinBusiness } from '@/components/screens/business/JoinBusiness'

export const metadata: Metadata = { title: 'Join the team', robots: { index: false } }

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <JoinBusiness token={token} />
}
