import { JobBuilder } from '@/components/screens/builder/JobBuilder'

export default async function PostJobPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string }>
}) {
  const { draftId } = await searchParams
  return <JobBuilder draftId={draftId ?? null} />
}
