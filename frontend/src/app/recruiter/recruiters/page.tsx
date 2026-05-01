import { redirect } from 'next/navigation'

export default function RecruitersRedirectPage() {
  redirect('/recruiter/team?tab=recruiters')
}
