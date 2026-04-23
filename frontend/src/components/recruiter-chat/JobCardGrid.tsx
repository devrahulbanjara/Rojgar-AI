'use client'

import { useRouter } from 'next/navigation'

import type { CompanyJobData, CompanyJobListResult } from '@/lib/types/recruiterChat'

import { getStatusTone } from './utils'

function formatPostedOn(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function JobRow({ job }: { job: CompanyJobData }) {
  const router = useRouter()

  return (
    <button
      type="button"
      className="recruiter-chat-job-mini-row"
      onClick={() => router.push(`/recruiter/jobs/${job.job_id}`)}
    >
      <div className="recruiter-chat-job-mini-row__main">
        <div className="recruiter-chat-job-mini-row__header">
          <div className="recruiter-chat-job-mini-row__title">{job.title}</div>
          <span className={`status-dot status-dot--${getStatusTone(job.status)}`}>
            {job.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="recruiter-chat-job-mini-row__posted">
          Posted {formatPostedOn(job.created_at)}
        </div>
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
