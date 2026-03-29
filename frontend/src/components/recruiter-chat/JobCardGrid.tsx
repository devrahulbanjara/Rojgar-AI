'use client'

import { useRouter } from 'next/navigation'

import type { CompanyJobData, CompanyJobListResult } from '@/lib/types/recruiterChat'
import { MapPin } from 'lucide-react'

import { getStatusTone } from './utils'

function JobRow({ job }: { job: CompanyJobData }) {
  const router = useRouter()
  const locationLabel = job.location ? `${job.location_type}, ${job.location}` : job.location_type

  return (
    <button
      type="button"
      className="recruiter-chat-job-mini-row"
      onClick={() => router.push(`/recruiter/jobs/${job.job_id}`)}
    >
      <div className="recruiter-chat-job-mini-row__title">{job.title}</div>
      <div className="recruiter-chat-job-mini-row__meta">
        <span className={`recruiter-chat-badge recruiter-chat-badge--${getStatusTone(job.status)}`}>
          {job.status.replace(/_/g, ' ')}
        </span>
        <span className="recruiter-chat-job-mini-row__location">
          <MapPin size={12} />
          <span>{locationLabel}</span>
        </span>
      </div>
    </button>
  )
}

export function JobCardGrid({ data }: { data: CompanyJobListResult }) {
  if (!data.jobs.length) {
    return (
      <section className="recruiter-chat-card recruiter-chat-card--empty-state">
        <p>You do not have any company jobs posted yet.</p>
      </section>
    )
  }

  return (
    <section className="recruiter-chat-card-shell">
      <div className="recruiter-chat-card-count">
        {data.total} job{data.total === 1 ? '' : 's'} found
      </div>

      <div className="recruiter-chat-job-mini-list">
        {data.jobs.map((job) => (
          <JobRow key={job.job_id} job={job} />
        ))}
      </div>
    </section>
  )
}
