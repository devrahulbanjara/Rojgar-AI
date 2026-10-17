import { redirect } from 'next/navigation'

// There is no job board: every job has its own page at /jobs/[slug], and each
// company lists its open jobs at /c/[slug].
export default function JobsIndex() {
  redirect('/')
}
