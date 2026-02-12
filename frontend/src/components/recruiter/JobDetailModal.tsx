'use client'

import React from 'react'
import {
  Briefcase,
  CheckCircle2,
  Sparkles,
  X,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ExternalLink,
  Edit,
  Ban,
  Trash2,
  BookmarkPlus,
} from 'lucide-react'
import type { Job } from '../../types/job'

interface JobWithExtras extends Job {
  job_responsibilities?: string[]
}
import { Dialog } from '../../components/ui/dialog'
import { ActionButton } from '../../components/ui'
import { Badge } from '../../components/ui/badge'
import { jobUtils } from '../../services/jobService'
import { useAutoShortlist } from '../../hooks/useAutoShortlist'

interface JobDetailModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (job: Job) => void
  onExpire?: (job: Job) => void
  onDelete?: (job: Job) => void
  onConvertToReferenceJD?: (job: Job) => void
}

export function JobDetailModal({
  job,
  isOpen,
  onClose,
  onEdit,
  onExpire,
  onDelete,
  onConvertToReferenceJD,
}: JobDetailModalProps) {
  const jobId = job ? job.job_id || job.id?.toString() || null : null
  const {
    autoShortlist,
    isLoading: isLoadingAutoShortlist,
    toggle,
    isToggling,
  } = useAutoShortlist(jobId)

  if (!job) return null

  const handleEdit = () => {
    if (onEdit) {
      onEdit(job)
    }
  }

  const handleExpire = () => {
    if (onExpire) {
      onExpire(job)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(job)
    }
  }

  const handleConvertToReferenceJD = () => {
    if (onConvertToReferenceJD) {
      onConvertToReferenceJD(job)
    }
  }

  const isActive = job.status === 'Active' || job.status.toLowerCase() === 'active'
  const isExpired = job.status === 'Expired' || job.status.toLowerCase() === 'expired'

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-4" showCloseButton={false}>
      <div className="max-h-[85vh] overflow-hidden w-full max-w-3xl p-0 flex flex-col bg-background-surface rounded-[5px]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 pb-8">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1 flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">{job.title}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-text-secondary font-medium">
                    {job.company?.name ||
                      (job as unknown as { organization?: { name?: string } }).organization?.name ||
                      'Company'}
                  </p>
                  {/* Auto Shortlist Toggle - Aligned with company name */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-border-default px-2.5 py-1 rounded-full">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Auto Shortlist
                    </span>
                    <label
                      className="relative inline-flex items-center cursor-pointer"
                      title="Automatically shortlist candidates when job expires"
                    >
                      <input
                        type="checkbox"
                        checked={autoShortlist}
                        onChange={() => toggle()}
                        disabled={isLoadingAutoShortlist || isToggling || !jobId}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Standardized Badges - Brand color for department, neutral for rest */}
            <div className="flex flex-wrap gap-2 mb-8">
              {job.department && (
                <Badge className="bg-primary-600 hover:bg-primary-700 text-white border-0 text-[14px] font-medium">
                  {job.department}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                {job.level}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                {job.location_type}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                {job.employment_type}
              </Badge>
              {job.applicant_count !== undefined && job.applicant_count > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
                >
                  {job.applicant_count} applicants
                </Badge>
              )}
            </div>

            {/* Key Info Row - Clean horizontal layout with proper grid structure */}
            <div className="grid grid-cols-3 gap-6 p-6 rounded-xl border border-border-default bg-slate-50/50 dark:bg-slate-900/30 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center">
                  <MapPin className="w-[18px] h-[18px] text-primary-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Location
                  </p>
                  <p className="text-[14px] font-medium text-slate-900 dark:text-slate-50">
                    {job.location_city && job.location_country
                      ? `${job.location_city}, ${job.location_country}`
                      : job.location_city ||
                        job.location_country ||
                        job.location ||
                        'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-border-default pl-6">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center">
                  <DollarSign className="w-[18px] h-[18px] text-primary-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Salary
                  </p>
                  <p className="text-[14px] font-medium text-slate-900 dark:text-slate-50">
                    {jobUtils.formatJobSalary(job)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-border-default pl-6">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center">
                  <Clock className="w-[18px] h-[18px] text-primary-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Posted
                  </p>
                  <p className="text-[14px] font-medium text-slate-900 dark:text-slate-50">
                    {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sections with clean left border design */}
            <div className="space-y-8">
              {job.company && (
                <Section icon={<Building2 className="w-4 h-4" />} title="About the Company">
                  <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {job.company.description ||
                      `${job.company.name} is looking for talented individuals to join their team.`}
                  </p>
                  {(job.company.website || job.company.location || job.company.industry) && (
                    <div className="flex gap-3 mt-4">
                      {job.company.website && (
                        <a
                          href={
                            job.company.website.startsWith('http')
                              ? job.company.website
                              : `https://${job.company.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Visit Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </Section>
              )}

              {job.description && (
                <Section icon={<Briefcase className="w-4 h-4" />} title="Job Summary">
                  <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {job.description}
                  </p>
                </Section>
              )}

              {(() => {
                const jobWithExtras = job as JobWithExtras
                return jobWithExtras.job_responsibilities &&
                  jobWithExtras.job_responsibilities.length > 0 ? (
                  <Section icon={<Briefcase className="w-4 h-4" />} title="Responsibilities">
                    <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {jobWithExtras.job_responsibilities.map((resp: string, index: number) => (
                        <li key={index}>{resp}</li>
                      ))}
                    </ul>
                  </Section>
                ) : null
              })()}

              {job.requirements && job.requirements.length > 0 && (
                <Section
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  title="Required Qualifications"
                >
                  <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {job.nice_to_have && job.nice_to_have.length > 0 && (
                <Section icon={<Sparkles className="w-4 h-4" />} title="Preferred">
                  <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {job.nice_to_have.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <Section icon={<Sparkles className="w-4 h-4" />} title="Compensation & Benefits">
                  <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </div>
        </div>

        {/* Standardized Footer with Action Hierarchy */}
        <div className="border-t border-border-default bg-slate-50/50 dark:bg-slate-900/30 px-10 py-6 flex items-center justify-between rounded-b-[5px]">
          <div className="flex items-center gap-3">
            {onDelete && (
              <ActionButton
                onClick={handleDelete}
                variant="ghost"
                size="md"
                className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-950/30"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </ActionButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onConvertToReferenceJD && (isActive || isExpired) && (
              <ActionButton
                onClick={handleConvertToReferenceJD}
                variant="outline"
                size="md"
                className="text-slate-600 dark:text-slate-400"
              >
                <BookmarkPlus className="w-4 h-4" />
                Save as Template
              </ActionButton>
            )}
            {isActive && onExpire && (
              <ActionButton
                onClick={handleExpire}
                variant="outline"
                size="md"
                className="text-slate-600 dark:text-slate-400"
              >
                <Ban className="w-4 h-4" />
                Expire
              </ActionButton>
            )}
            <ActionButton onClick={handleEdit} variant="primary" size="md" className="px-8">
              <Edit className="w-4 h-4" />
              Edit Job
            </ActionButton>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

// Clean section component with standardized typography scale
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900 transition-colors pt-1">
      <div className="absolute -left-[11px] top-1 p-1 bg-white dark:bg-slate-900 border border-border-default rounded-md text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}
