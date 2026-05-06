import { redirect } from 'next/navigation'

export default async function RecruiterCandidateDetailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ application_id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { application_id } = await params
  const query = await searchParams

  const search = new URLSearchParams()
  search.set('app', application_id)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (key === 'app' || key === 'tab') continue
    if (typeof value === 'string') search.set(key, value)
  }
  redirect(`/recruiter/talent?${search.toString()}`)
}
