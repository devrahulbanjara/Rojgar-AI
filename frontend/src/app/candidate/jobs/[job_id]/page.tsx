'use client'

import { useState } from 'react'
import { notify } from '@/lib/notify'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { getCompanyAccent } from '@/lib/companyAccent'
import { formatDate, formatSalary } from '@/lib/jobHelpers'
import {
  type JobDetail,
  type JobListItem,
  type LocationType,
  getJobStatusLabel,
  useGetJobByIdQuery,
  useSearchJobsQuery,
} from '@/store/services/jobsApi'
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  Share2,
  Users,
} from 'lucide-react'

import Avatar from '@/components/common/Avatar'
import ApplyFlowModal from '@/components/jobs/ApplyModal'

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
}

function formatSalaryRange(job: JobListItem): string {
  if (job.salary_min == null && job.salary_max == null) return 'Salary not specified'
  if (job.salary_min != null && job.salary_max != null) {
    return `${job.currency} ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min != null) {
    return `${job.currency} ${job.salary_min.toLocaleString()}+`
  }
  return `Up to ${job.currency} ${job.salary_max!.toLocaleString()}`
}

function buildSubtitle(job: JobDetail): string {
  const parts: string[] = []
  if (job.company?.name) parts.push(job.company.name)
  if (job.location) parts.push(job.location)
  parts.push(LOCATION_TYPE_LABELS[job.location_type])
  const salary = formatSalary(job.salary_min, job.salary_max, job.currency)
  if (salary) parts.push(salary)
  return parts.join(' · ')
}

function ApplyModal({
  jobId,
  jobTitle,
  onClose,
  onSuccess,
}: {
  jobId: string
  jobTitle: string
  onClose: () => void
  onSuccess?: () => void
}) {
  return (
    <ApplyFlowModal
      isOpen={true}
      jobId={jobId}
      jobTitle={jobTitle}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}

function RecommendedCard({ job, index }: { job: JobListItem; index: number }) {
  const accent = getCompanyAccent(job.company?.name ?? job.title)

  return (
    <Link
      href={`/candidate/jobs/${job.id}`}
      className="job-card job-card--recommended content-stagger-item"
      style={{ '--stagger-index': index, textDecoration: 'none' } as React.CSSProperties}
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
          <div className="job-card__company">
            <span className="job-card__company-name">{job.company?.name}</span>
            <span className="job-card__location job-card__location--inline">
              <span className="job-card__location-sep">·</span>
              <span>{job.location ?? job.location_type}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="job-meta">
        <span className="job-meta__item">{job.location_type}</span>
        {job.company?.industry && (
          <>
            <span className="job-meta__sep" aria-hidden="true">
              ·
            </span>
            <span className="job-meta__item">{job.company.industry}</span>
          </>
        )}
      </div>
      <div className="job-card__meta">
        <span>
          <Banknote size={12} aria-hidden="true" />
          {formatSalaryRange(job)}
        </span>
        <span className="btn btn--primary btn--sm job-card__meta-time">View</span>
      </div>
    </Link>
  )
}

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.job_id as string
  const [applying, setApplying] = useState(false)

  const { data: resp, isLoading, isError, refetch } = useGetJobByIdQuery(jobId)
  const job: JobDetail | undefined = resp?.data

  const { data: jobsResp } = useSearchJobsQuery({ q: job?.title, size: 7 }, { skip: !job?.title })
  const recommended = (jobsResp?.data?.items ?? []).filter((j) => j.id !== jobId).slice(0, 6)

  const salary = job ? formatSalary(job.salary_min, job.salary_max, job.currency) : null
  const hiringCompleted = job?.hiring_completed === true
  const isActive = job?.status === 'active' && !hiringCompleted
  const hasApplied = job?.has_applied

  if (isLoading) {
    return (
      <div className="dash-content container dash-content--pad-top">
        <Link
          href="/candidate/jobs"
          className="btn btn--ghost btn--sm"
          style={{ alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>
        <div className="jd-detail-header-skeleton" aria-hidden="true">
          <div className="jd-detail-header-skeleton__title" />
          <div className="jd-detail-header-skeleton__subtitle" />
        </div>
        <div className="jd-detail">
          <div className="jd-detail__main">
            <div className="jd-detail__skeleton-section" />
            <div className="jd-detail__skeleton-section" />
            <div className="jd-detail__skeleton-section" />
          </div>
          <div className="jd-detail__sidebar">
            <div className="jd-detail__skeleton-sidebar" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="dash-content container dash-content--pad-top">
        <Link
          href="/candidate/jobs"
          className="btn btn--ghost btn--sm"
          style={{ alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>
        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">Job not found</h2>
            <p className="dash-page-header__subtitle">
              This job could not be found or has been removed.
            </p>
          </div>
        </div>
        <button
          className="btn btn--secondary btn--sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => void refetch()}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="dash-content container dash-content--pad-top">
        <Link
          href="/candidate/jobs"
          className="btn btn--ghost btn--sm"
          style={{ alignSelf: 'flex-start' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Jobs
        </Link>

        <div className="dash-page-header">
          <div className="dash-page-header__left">
            <h2 className="dash-page-header__title">{job.title}</h2>
            <p className="dash-page-header__subtitle">{buildSubtitle(job)}</p>
          </div>
          <div className="dash-page-header__actions">
            <button
              className="btn btn--primary"
              onClick={() => {
                if (!hasApplied && !hiringCompleted) setApplying(true)
              }}
              disabled={!isActive || hasApplied || hiringCompleted}
              title={
                hiringCompleted
                  ? 'This position has been filled.'
                  : hasApplied
                    ? 'You have already applied to this job.'
                    : isActive
                      ? undefined
                      : job.status === 'draft'
                        ? 'This job is still in draft.'
                        : 'This job has expired.'
              }
            >
              {hiringCompleted
                ? 'Position filled'
                : hasApplied
                  ? 'Applied'
                  : isActive
                    ? 'Apply Now'
                    : getJobStatusLabel(job.status)}
            </button>
            <button
              className="btn btn--icon btn--sm"
              onClick={() => {
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => notify.info('Link copied!'))
              }}
              aria-label="Share link"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {hiringCompleted ? (
          <div
            role="status"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 12,
              background: 'var(--color-gray-50, #f9fafb)',
              border: '1px solid var(--color-gray-200, #e5e7eb)',
              color: 'var(--color-gray-700, #374151)',
              fontSize: '0.9375rem',
            }}
          >
            <strong>This position has been filled.</strong> The company is no longer accepting
            applications for this role.
          </div>
        ) : null}

        <div className="jd-detail">
          <div className="jd-detail__main">
            {job.overview && (
              <section className="jd-detail__section">
                <h3 className="jd-detail__heading">About the Role</h3>
                <p className="jd-detail__text">{job.overview}</p>
              </section>
            )}

            {job.responsibilities.length > 0 && (
              <section className="jd-detail__section">
                <h3 className="jd-detail__heading">Responsibilities</h3>
                <ul className="jd-detail__list">
                  {job.responsibilities.map((item, i) => (
                    <li key={i} className="jd-detail__list-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.requirements.length > 0 && (
              <section className="jd-detail__section">
                <h3 className="jd-detail__heading">Requirements</h3>
                <ul className="jd-detail__list">
                  {job.requirements.map((item, i) => (
                    <li key={i} className="jd-detail__list-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.preferred_qualifications.length > 0 && (
              <section className="jd-detail__section">
                <h3 className="jd-detail__heading">Preferred Qualifications</h3>
                <ul className="jd-detail__list">
                  {job.preferred_qualifications.map((item, i) => (
                    <li key={i} className="jd-detail__list-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {job.benefits.length > 0 && (
              <section className="jd-detail__section">
                <h3 className="jd-detail__heading">Benefits</h3>
                <ul className="jd-detail__list">
                  {job.benefits.map((item, i) => (
                    <li key={i} className="jd-detail__list-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="jd-detail__sidebar">
            <div className="jd-detail__sidebar-card">
              <div className="jd-detail__sidebar-section">
                <Avatar
                  name={job.company?.name ?? job.title}
                  src={job.company?.logo_url}
                  seed={job.company?.id ?? job.company?.name ?? job.title}
                  kind="company"
                  className="jd-detail__sidebar-logo"
                  sizes="48px"
                />
                <span className="jd-detail__sidebar-company">{job.company?.name ?? 'Unknown'}</span>
                {job.company?.industry && (
                  <span className="jd-detail__sidebar-industry">{job.company.industry}</span>
                )}
              </div>

              <dl className="jd-detail__meta">
                <div className="jd-detail__meta-row">
                  <dt>
                    <MapPin aria-hidden="true" /> Location
                  </dt>
                  <dd>{job.location ?? 'Not specified'}</dd>
                </div>
                <div className="jd-detail__meta-row">
                  <dt>
                    <Briefcase aria-hidden="true" /> Work Type
                  </dt>
                  <dd>{LOCATION_TYPE_LABELS[job.location_type]}</dd>
                </div>
                {salary && (
                  <div className="jd-detail__meta-row">
                    <dt>
                      <DollarSign aria-hidden="true" /> Salary
                    </dt>
                    <dd>{salary}</dd>
                  </div>
                )}
                <div className="jd-detail__meta-row">
                  <dt>
                    <Clock aria-hidden="true" /> Posted
                  </dt>
                  <dd>{formatDate(job.created_at)}</dd>
                </div>
                <div className="jd-detail__meta-row">
                  <dt>
                    <Users aria-hidden="true" /> Applicants
                  </dt>
                  <dd>{job.applications_count}</dd>
                </div>
                {job.company?.company_size && (
                  <div className="jd-detail__meta-row">
                    <dt>
                      <Users aria-hidden="true" /> Company Size
                    </dt>
                    <dd>{job.company.company_size}</dd>
                  </div>
                )}
              </dl>

              {job.company?.website_url && (
                <div className="jd-detail__sidebar-section">
                  <a
                    href={job.company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost btn--sm"
                  >
                    Visit Website ↗
                  </a>
                </div>
              )}
            </div>

            {job.company?.description && (
              <div className="jd-detail__sidebar-card" style={{ marginTop: '1rem' }}>
                <div className="jd-detail__sidebar-section" style={{ borderBottom: 0 }}>
                  <span className="jd-detail__sidebar-company">About {job.company.name}</span>
                </div>
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <p className="jd-detail__text">{job.company.description}</p>
                </div>
              </div>
            )}
          </aside>
        </div>

        {recommended.length > 0 && (
          <div className="dash-card">
            <div className="dash-card__header">
              <div>
                <div className="dash-card__title dash-card__title--sm">Recommended for You</div>
                <div className="dash-card__subtitle">Based on your profile and skills</div>
              </div>
              <Link href="/candidate/jobs" className="btn btn--secondary btn--sm">
                Browse All Jobs
              </Link>
            </div>
            <div className="dash-card__body dash-card__body--recommended-jobs">
              <div className="recommended-jobs-grid">
                {recommended.map((j, index: number) => (
                  <RecommendedCard key={j.id} job={j} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {applying && (
        <ApplyModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setApplying(false)}
          onSuccess={() => {
            void refetch()
          }}
        />
      )}
    </>
  )
}
