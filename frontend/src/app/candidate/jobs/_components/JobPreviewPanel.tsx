'use client'

import Link from 'next/link'

import {
  type JobDetail,
  type JobListItem,
  type LocationType,
  getJobStatusLabel,
  useGetJobByIdQuery,
} from '@/store/services/jobsApi'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import StatusPill from '@/components/common/StatusPill'

import { JobPreviewSkeleton } from './JobsSkeletons'

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

function getCompanyAccent(name: string): { logo: string; color: string } {
  const palette = ['#0f766e', '#2563eb', '#dc2626', '#9333ea', '#d97706', '#0891b2']
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return {
    logo: name.trim().charAt(0).toUpperCase() || 'C',
    color: palette[seed % palette.length],
  }
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

function formatExpiryDate(iso: string | null): { text: string; color: string } | null {
  if (!iso) return null

  const expiryDate = new Date(iso)
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 86400000)

  if (daysUntilExpiry < 0) {
    return { text: 'Expired', color: '#ff4d4d' }
  }

  if (daysUntilExpiry === 0) {
    return { text: 'Expires today', color: '#f59e0b' }
  }

  if (daysUntilExpiry === 1) {
    return { text: 'Expires tomorrow', color: '#f59e0b' }
  }

  if (daysUntilExpiry <= 7) {
    return { text: `Expires in ${daysUntilExpiry} days`, color: '#f59e0b' }
  }

  return {
    text: `Expires ${expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    color: '#6b7280',
  }
}

type JobPreviewPanelProps = {
  jobId: string
  allJobs: JobListItem[]
  onApply: () => void
}

export default function JobPreviewPanel({ jobId, allJobs, onApply }: JobPreviewPanelProps) {
  const { data: resp, isLoading } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data
  const selectedListJob = allJobs.find((item) => item.id === jobId)

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
  const hasApplied = selectedListJob?.has_applied ?? job.has_applied
  const openRolesCount = allJobs.filter((j) => j.company_id === job.company_id).length
  const previewLogoUrl = job.company?.logo_url ?? selectedListJob?.company?.logo_url ?? null
  const previewCompanyName = job.company?.name ?? selectedListJob?.company?.name ?? 'Company'
  const accent = getCompanyAccent(previewCompanyName)

  return (
    <div className="job-preview content-fade-in">
      <div className="job-preview__header">
        <Avatar
          name={previewCompanyName}
          src={previewLogoUrl}
          seed={job.company?.id ?? selectedListJob?.company?.id ?? previewCompanyName}
          kind="company"
          className="job-preview__logo"
          sizes="56px"
          style={{ '--jp-logo': accent.color } as React.CSSProperties}
        />
        <div className="job-preview__date">Posted {formatDate(job.created_at)}</div>
        <div className="job-preview__title">{job.title}</div>
        <div className="job-preview__company">{previewCompanyName}</div>
        <div className="job-preview__location">
          <MapPin size={12} aria-hidden="true" />
          {job.location ?? 'Location not specified'} · {LOCATION_TYPE_LABELS[job.location_type]}
        </div>
      </div>

      <div className="job-preview__company-meta">
        {job.company?.industry && <span>{job.company.industry}</span>}
        {job.company?.company_size && <span>· {job.company.company_size}</span>}
        {openRolesCount > 1 && <span>· {openRolesCount} active roles</span>}
      </div>

      <div className="job-meta job-preview__chips">
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
        <StatusPill kind="job" status={job.status} />
        {job.expires_at &&
          (() => {
            const expiry = formatExpiryDate(job.expires_at)
            if (!expiry) return null
            const mod =
              expiry.color === '#ff4d4d'
                ? 'expiry-danger'
                : expiry.color === '#f59e0b'
                  ? 'expiry-warning'
                  : 'time'
            return (
              <>
                <span className="job-meta__sep" aria-hidden="true">
                  ·
                </span>
                <span className={`job-meta__item job-meta__item--${mod}`}>
                  <Calendar size={11} aria-hidden="true" />
                  {expiry.text}
                </span>
              </>
            )
          })()}
      </div>

      {job.overview && (
        <div className="job-preview__overview">
          <div className="job-preview__overview-label">About the Role</div>
          <p className="job-preview__overview-text">{job.overview}</p>
        </div>
      )}

      <div className="job-preview__cta">
        <Link href={`/candidate/jobs/${job.id}`} className="btn btn--secondary btn--sm">
          View Details
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <button
          className="btn btn--primary btn--sm"
          onClick={onApply}
          disabled={!isActive || hasApplied}
          title={hasApplied ? 'You have already applied to this job.' : undefined}
        >
          {hasApplied ? 'Applied' : isActive ? 'Quick Apply' : getJobStatusLabel(job.status)}
        </button>
      </div>
    </div>
  )
}
