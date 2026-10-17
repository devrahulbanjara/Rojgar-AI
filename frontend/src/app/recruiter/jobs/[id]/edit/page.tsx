'use client'

import { useParams } from 'next/navigation'

import { JobBuilder } from '@/components/screens/builder/JobBuilder'

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>()
  return <JobBuilder key={id} jobId={id} />
}
