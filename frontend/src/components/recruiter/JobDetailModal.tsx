'use client'

import React from 'react'
import Image from 'next/image'
import {
  Briefcase,
  CheckCircle2,
  Sparkles,
  X,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Globe,
  ExternalLink,
  UserCircle2,
  MapPinned,
  ClockIcon,
  TrendingUp,
  Edit,
  ArrowRight,
  Ban,
  Trash2,
  BookmarkPlus,
  Zap,
} from 'lucide-react'
import type { Job } from '../../types/job'

interface JobWithExtras extends Job {
  job_responsibilities?: string[]
}
import { Dialog } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { jobUtils } from '../../services/jobService'
import { cn } from '../../lib/utils'
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
  // Get job ID for auto shortlist (prefer job_id, fallback to id as string)
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

  const isActive = job.status === 'Active' || job.status === 'active'

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[900px] mx-4 rounded-[20px]"
      showCloseButton={false}
    >
      <div className="max-h-[90vh] overflow-hidden w-full max-w-[900px] p-0 flex flex-col rounded-[20px] bg-background-surface">
        {/* Enhanced Header with subtle background */}
        <div className="bg-gradient-to-b from-background-subtle/80 to-background-surface px-12 py-12 border-b border-border-subtle relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-background-subtle transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>

          {/* Company Logo & Title */}
          <div className="flex items-start gap-4 mb-6">
            {job.company?.logo && (
              <div className="flex-shrink-0">
                <Image
                  src={job.company.logo}
                  alt={job.company.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover border border-border-default shadow-sm"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-[28px] font-bold text-text-primary leading-tight mb-2">
                {job.title}
              </h2>
              <p className="text-lg text-text-secondary font-medium tracking-[0.3px]">
                {job.company?.name ||
                  (job as unknown as { organization?: { name?: string } }).organization?.name ||
                  'Company'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {job.department && (
                <Badge
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                    'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                  )}
                >
                  {job.department}
                </Badge>
              )}
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                )}
              >
                <UserCircle2 className="w-4 h-4 mr-1.5" />
                {job.level}
              </Badge>
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 hover:bg-success-100 dark:hover:bg-success-900/30'
                )}
              >
                <MapPinned className="w-4 h-4 mr-1.5" />
                {job.location_type}
              </Badge>
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-ai-50 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 hover:bg-ai-100 dark:hover:bg-ai-900/30'
                )}
              >
                <ClockIcon className="w-4 h-4 mr-1.5" />
                {job.employment_type}
              </Badge>
              {job.applicant_count !== undefined && job.applicant_count > 0 && (
                <Badge
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                    'bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 hover:bg-warning-100 dark:hover:bg-warning-900/30'
                  )}
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  {job.applicant_count} applicants
                </Badge>
              )}
            </div>

            <div className="inline-flex items-center gap-2 bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg px-3 py-2 group relative">
              <Zap
                className={cn(
                  'w-4 h-4 transition-colors',
                  autoShortlist ? 'text-warning-600' : 'text-text-muted'
                )}
              />
              <span className="text-sm font-medium text-text-primary">Auto Shortlist</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoShortlist}
                  onChange={toggle}
                  disabled={isLoadingAutoShortlist || isToggling || !jobId}
                  className="sr-only peer"
                />
                <div className="w-5 h-3 bg-background-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-warning-300 rounded-full peer peer-checked:after:translate-x-2 peer-checked:after:border-background-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background-surface after:border-border-strong after:border after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-warning-600" />
              </label>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Key Information Grid with dividers */}
          <div className="grid grid-cols-3 gap-10 mb-12 p-6 bg-background-subtle rounded-xl border border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-tertiary font-medium mb-0.5 whitespace-nowrap">
                  Location
                </p>
                <p className="text-sm font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                  {job.location_city && job.location_country
                    ? `${job.location_city}, ${job.location_country}`
                    : job.location_city || job.location_country || job.location || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-border-default pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-tertiary font-medium mb-0.5 whitespace-nowrap">
                  Salary
                </p>
                <p className="text-sm font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatJobSalary(job)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-border-default pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-ai-100 dark:bg-ai-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-ai-600 dark:text-ai-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-tertiary font-medium mb-0.5 whitespace-nowrap">
                  Posted
                </p>
                <p className="text-sm font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
                </p>
              </div>
            </div>
          </div>

          {/* About the Company - Enhanced */}
          {job.company && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  About the Company
                </h3>
              </div>
              <div className="pl-14">
                {job.company.description ? (
                  <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                    {job.company.description}
                  </p>
                ) : (
                  <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                    {job.company.name} is looking for talented individuals to join their team.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {job.company.location && (
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-background-surface border border-border-default rounded-xl text-sm text-text-secondary hover:bg-background-subtle hover:border-border-strong transition-all duration-200 hover:scale-105">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{job.company.location}</span>
                    </button>
                  )}
                  {job.company.industry && (
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-background-surface border border-border-default rounded-xl text-sm text-text-secondary hover:bg-background-subtle hover:border-border-strong transition-all duration-200 hover:scale-105">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{job.company.industry}</span>
                    </button>
                  )}
                  {job.company.website && (
                    <a
                      href={
                        job.company.website.startsWith('http')
                          ? job.company.website
                          : `https://${job.company.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-background-surface border border-border-default rounded-xl text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 hover:scale-105 font-medium"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Visit Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Job Summary - Enhanced */}
          {job.description && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-ai-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-ai-50 dark:bg-ai-900/30">
                  <Briefcase className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  Job Summary
                </h3>
              </div>
              <div className="pl-14 prose prose-sm max-w-none">
                <p className="text-[16px] text-text-secondary leading-[1.8] whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </section>
          )}

          {/* Job Responsibilities - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras
            return jobWithExtras.job_responsibilities &&
              jobWithExtras.job_responsibilities.length > 0 ? (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-primary-600 rounded-full" />
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                    <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                    Job Responsibilities
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {jobWithExtras.job_responsibilities.map((resp: string, index: number) => (
                      <li
                        key={index}
                        className="text-[15px] text-text-secondary leading-relaxed pl-2"
                      >
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null
          })()}

          {/* Required Qualifications - Enhanced */}
          {job.requirements && job.requirements.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-success-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/30">
                  <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  Required Qualifications
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.requirements.map((req, index) => (
                    <li
                      key={index}
                      className="text-[15px] text-text-secondary leading-relaxed pl-2"
                    >
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Preferred - Enhanced */}
          {job.nice_to_have && job.nice_to_have.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-warning-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-900/30">
                  <Sparkles className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  Preferred
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.nice_to_have.map((item, index) => (
                    <li
                      key={index}
                      className="text-[15px] text-text-secondary leading-relaxed pl-2"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Compensation & Benefits - Enhanced */}
          {job.benefits && job.benefits.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-ai-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-ai-50 dark:bg-ai-900/30">
                  <Sparkles className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  Compensation & Benefits
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="text-[15px] text-text-secondary leading-relaxed pl-2"
                    >
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer with Edit, Expire, Delete, and Save as Template Buttons */}
        <div className="border-t border-border-default bg-background-surface px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            {onDelete && (
              <Button
                onClick={handleDelete}
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-semibold border-error-300 text-error-700 hover:bg-error-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Job
              </Button>
            )}
            {onConvertToReferenceJD &&
              (isActive || job.status === 'Closed' || job.status === 'Expired') && (
                <Button
                  onClick={handleConvertToReferenceJD}
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-semibold border-ai-300 text-ai-700 hover:bg-ai-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
                >
                  <BookmarkPlus className="w-5 h-5 mr-2" />
                  Save as Template
                </Button>
              )}
          </div>
          <div className="flex items-center gap-4">
            {isActive && onExpire && (
              <Button
                onClick={handleExpire}
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-semibold border-warning-300 text-warning-700 hover:bg-warning-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
              >
                <Ban className="w-5 h-5 mr-2" />
                Expire Job
              </Button>
            )}
            <Button
              onClick={handleEdit}
              size="lg"
              className="h-12 px-8 text-base font-semibold btn-primary-gradient transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
            >
              <Edit className="w-5 h-5 mr-2" />
              Edit Job
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
