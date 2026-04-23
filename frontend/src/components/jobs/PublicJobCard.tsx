'use client'

import Link from 'next/link'

import { LOCATION_TYPE_LABELS, formatDate, formatSalary, getCompanyAccent } from '@/lib/jobHelpers'
import type { JobListItem } from '@/store/services/jobsApi'
import { Briefcase, Clock, MapPin } from 'lucide-react'

import MediaBadge from '@/components/common/MediaBadge'

export default function PublicJobCard({ job }: { job: JobListItem }) {
  const accent = getCompanyAccent(job.company?.name ?? job.title)
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)

  return (
    <Link
      href={`/login?next=/candidate/jobs/${job.id}`}
      className="pub-job-card job-card"
      style={{ textDecoration: 'none' }}
    >
      <div className="job-card__header">
        <MediaBadge
          src={job.company?.logo_url}
          alt={job.company?.name ?? job.title}
          fallback={accent.logo}
          className="job-card__logo"
          sizes="40px"
          style={
            {
              '--logo-bg': accent.color + '1A',
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

      <div className="job-meta">
        <span className="job-meta__item">{LOCATION_TYPE_LABELS[job.location_type]}</span>
        {salary && (
          <>
            <span className="job-meta__sep" aria-hidden="true">
              ·
            </span>
            <span className="job-meta__item job-meta__item--salary">{salary}</span>
          </>
        )}
        <span className="job-meta__sep" aria-hidden="true">
          ·
        </span>
        <span className="job-meta__item job-meta__item--time">
          <Clock size={11} aria-hidden="true" />
          {formatDate(job.created_at)}
        </span>
      </div>

      <div className="pub-job-card__hint">Sign in to apply &rarr;</div>
    </Link>
  )
}
