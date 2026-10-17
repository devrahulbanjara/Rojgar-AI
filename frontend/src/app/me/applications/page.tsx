import type { Metadata } from 'next'

import { getT } from '@/lib/i18n/server'

import { MyApplications } from '@/components/me/MyApplications'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).me.title }
}

export default function MyApplicationsPage() {
  return <MyApplications />
}
