import { redirect } from 'next/navigation'

/** Old applicant links: the Applicants page opens them on their job page. */
export default async function RecruiterCandidateDetailRedirect({
  params,
}: {
  params: Promise<{ application_id: string }>
}) {
  const { application_id } = await params
  redirect(`/recruiter/candidates?app=${application_id}`)
}
