import { redirect } from 'next/navigation'

export default function RecruiterJobManualRedirect() {
  redirect('/recruiter/jobs/new?mode=manual')
}
