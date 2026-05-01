import { redirect } from 'next/navigation'

export default function RecruiterCandidateDetailRedirect({
  params,
  searchParams,
}: {
  params: { application_id: string }
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const search = new URLSearchParams()
  search.set('app', params.application_id)
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === 'app' || key === 'tab') continue
    if (typeof value === 'string') search.set(key, value)
  }
  redirect(`/recruiter/talent?${search.toString()}`)
}
