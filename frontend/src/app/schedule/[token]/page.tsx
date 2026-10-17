import type { Metadata } from 'next'

import { getT } from '@/lib/i18n/server'

import { ScheduleView } from '@/components/public/schedule/ScheduleView'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).schedule.title, robots: { index: false } }
}

type Props = { params: Promise<{ token: string }> }

export default async function SchedulePage({ params }: Props) {
  return <ScheduleView token={(await params).token} />
}
