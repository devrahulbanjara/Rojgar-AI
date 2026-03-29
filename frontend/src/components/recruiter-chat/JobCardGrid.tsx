'use client'

import { useRouter } from 'next/navigation'

import type { CompanyJobData, CompanyJobListResult } from '@/lib/types/recruiterChat'
import { ArrowUpRight, CircleDollarSign, MapPin } from 'lucide-react'

import { formatMoney, getStatusTone } from './utils'

function JobRow({ job }: { job: CompanyJobData }) {
  const router = useRouter()
  const salaryLabel =
    job.salary_min || job.salary_max
      ? `${formatMoney(job.salary_min, job.currency)} - ${formatMoney(job.salary_max, job.currency)}`
      : 'Salary not specified'

  return (
    <button
      type="button"
      className="recruiter-chat-card recruiter-chat-card--job-row"
      onClick={() => router.push(`/recruiter/jobs/${job.job_id}/edit`)}
    >
      <div className="recruiter-chat-job-row__main">
        <div className="recruiter-chat-job-row__copy">
          <div className="recruiter-chat-job-row__name">{job.title}</div>
          {job.overview ? (
            <div className="recruiter-chat-job-row__summary">{job.overview}</div>
          ) : null}
          <div className="recruiter-chat-job-row__meta-copy recruiter-chat-job-row__meta-copy--chips">
            <span
              className={`recruiter-chat-badge recruiter-chat-badge--${getStatusTone(job.status)}`}
            >
              {job.status.replace(/_/g, ' ')}
            </span>
            <span className="recruiter-chat-badge recruiter-chat-badge--muted">
              {job.auto_shortlist ? 'AI screening on' : 'Manual screening'}
            </span>
          </div>
          <div className="recruiter-chat-job-row__meta-copy recruiter-chat-job-row__meta-copy--details">
            <span className="recruiter-chat-job-row__location">
              <MapPin size={13} />
              <span>
                {job.location ? `${job.location_type}, ${job.location}` : job.location_type}
              </span>
            </span>
            <span className="recruiter-chat-job-row__salary">
              <CircleDollarSign size={13} />
              <span>{salaryLabel}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="recruiter-chat-job-row__meta">
        <span className="recruiter-chat-job-row__cta">Edit</span>
        <ArrowUpRight size={14} className="recruiter-chat-job-row__chevron" />
      </div>
    </button>
  )
}

export function JobCardGrid({ data }: { data: CompanyJobListResult }) {
  if (!data.jobs.length) {
    return (
      <section className="recruiter-chat-card recruiter-chat-card--empty-state">
        <p>You don&apos;t have any company jobs posted yet.</p>
      </section>
    )
  }

  return (
    <section className="recruiter-chat-card-shell">
      <div className="recruiter-chat-card-count">
        {data.total} job{data.total === 1 ? '' : 's'} found
      </div>

      <div className="recruiter-chat-candidate-list">
        {data.jobs.map((job) => (
          <JobRow key={job.job_id} job={job} />
        ))}
      </div>
    </section>
  )
}
