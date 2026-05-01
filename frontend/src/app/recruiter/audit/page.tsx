import { redirect } from 'next/navigation'

export default function RecruiterAuditRedirectPage() {
  redirect('/recruiter/team?tab=audit')
}
