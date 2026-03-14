'use client'

import Link from 'next/link'

import {
  type JobDetail,
  type JobListItem,
  type LocationType,
  getJobStatusLabel,
  useGetJobByIdQuery,
} from '@/store/services/jobsApi'
import { ArrowRight, MapPin } from 'lucide-react'

import { JobPreviewSkeleton } from './JobsSkeletons'

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

function formatSalary(min?: number | null, max?: number | null, currency = 'NPR'): string | null {
  if (!min && !max) return null
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  if (min) return `From ${currency} ${min.toLocaleString()}`
  return `Up to ${currency} ${max!.toLocaleString()}`
}

function formatDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type JobPreviewPanelProps = {
  jobId: string
  allJobs: JobListItem[]
  onApply: () => void
}

export default function JobPreviewPanel({ jobId, allJobs, onApply }: JobPreviewPanelProps) {
  const { data: resp, isLoading } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data

  if (isLoading) return <JobPreviewSkeleton />

  if (!job)
    return (
      <div className="job-preview">
        <div className="job-preview__empty">
          <p>Could not load job details.</p>
        </div>
      </div>
    )

  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)
  const isActive = job.status === 'active'
  const openRolesCount = allJobs.filter((j) => j.company_id === job.company_id).length

  return (
    <div className="job-preview content-fade-in">
      <div
        className="job-preview__cover"
        style={
          {
            '--jp-from': 'rgba(0,112,243,0.18)',
            '--jp-to': 'rgba(121,40,202,0.1)',
          } as React.CSSProperties
        }
      >
        <div
          className="job-preview__logo"
          style={{ '--jp-logo': '#7928ca' } as React.CSSProperties}
        >
          {job.company?.logo_url ? (
            <img src={job.company.logo_url} alt={job.company.name} />
          ) : (
            job.title[0]
          )}
        </div>
      </div>

      <div className="job-preview__header">
        <div className="job-preview__date">Posted {formatDate(job.created_at)}</div>
        <div className="job-preview__title">{job.title}</div>
        <div className="job-preview__company">{job.company?.name}</div>
        <div className="job-preview__location">
          <MapPin size={12} aria-hidden="true" />
          {job.location ?? 'Location not specified'} · {LOCATION_TYPE_LABELS[job.location_type]}
        </div>
      </div>

      <div className="job-preview__company-meta">
        {job.company?.industry && <span>{job.company.industry}</span>}
        {job.company?.company_size && <span>· {job.company.company_size}</span>}
        {openRolesCount > 1 && (
          <span className="job-preview__chip job-preview__chip--success">
            {openRolesCount} active roles
          </span>
        )}
      </div>

      <div className="job-preview__chips">
        <span className="job-preview__chip">{LOCATION_TYPE_LABELS[job.location_type]}</span>
        {salary && <span className="job-preview__chip">{salary}</span>}
        <span
          className={`job-preview__chip${isActive ? ' job-preview__chip--success' : ' job-preview__chip--gray'}`}
        >
          {getJobStatusLabel(job.status)}
        </span>
      </div>

      {job.overview && (
        <div className="job-preview__overview">
          <div className="job-preview__overview-label">About the Role</div>
          <p className="job-preview__overview-text">{job.overview}</p>
        </div>
      )}

      <div className="job-preview__cta">
        <Link href={`/candidate/jobs/${job.id}`} className="btn btn--outline btn--primary btn--sm">
          View Details
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <button className="btn btn--primary btn--sm" onClick={onApply} disabled={!isActive}>
          {isActive ? 'Quick Apply' : getJobStatusLabel(job.status)}
        </button>
      </div>
    </div>
  )
}
