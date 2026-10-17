'use client'

import Link from 'next/link'

import { getCompanyAccent } from '@/lib/companyAccent'
import { LOCATION_TYPE_LABELS, formatDate, formatSalary } from '@/lib/jobHelpers'
import type { JobListItem } from '@/store/services/jobsApi'
import { Briefcase, ChevronRight, Clock, MapPin } from 'lucide-react'

import Avatar from '@/components/common/Avatar'

export default function PublicJobCard({ job }: { job: JobListItem }) {
  const accent = getCompanyAccent(job.company?.name ?? job.title)
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)

  return (
    <Link
      href={`/login?next=${encodeURIComponent(`/candidate/jobs/${job.id}?apply=1`)}`}
      className="pub-job-card job-card"
      style={{ textDecoration: 'none' }}
    >
      <div className="job-card__header">
        <Avatar
          name={job.company?.name ?? job.title}
          src={job.company?.logo_url}
          seed={job.company?.id ?? job.company?.name ?? job.title}
          kind="company"
          className="job-card__logo"
          sizes="40px"
          style={
            {
              '--logo-bg': accent.background,
              '--logo-color': accent.color,
            } as React.CSSProperties
          }
        />
        <div className="job-card__title-wrap">
          <div className="job-card__title">{job.title}</div>
          <div className="job-card__company">{job.company?.name}</div>
          <div className="job-card__location">
            {job.location ? (
              <MapPin size={11} aria-hidden="true" />
            ) : (
              <Briefcase size={11} aria-hidden="true" />
            )}
            <span>
              {job.location ? `${job.location} · ` : ''}
              {LOCATION_TYPE_LABELS[job.location_type]}
            </span>
          </div>
        </div>
      </div>

      <div className="pub-job-card__footer">
        <div className="pub-job-card__meta-row">
          {salary && <span className="job-meta__item job-meta__item--salary">{salary}</span>}
          <span className="job-meta__item job-meta__item--time">
            <Clock size={11} aria-hidden="true" />
            {formatDate(job.created_at)}
          </span>
        </div>
        <ChevronRight size={16} className="pub-job-card__chevron" aria-hidden="true" />
      </div>
    </Link>
  )
}
