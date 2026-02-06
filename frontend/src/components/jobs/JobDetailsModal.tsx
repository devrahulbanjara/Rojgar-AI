import React, { useState } from 'react'
import { ApplicationModal } from './ApplicationModal'
import Image from 'next/image'
import { Dialog, DialogContent } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  X,
  Briefcase,
  Sparkles,
  Globe,
  Share2,
  TrendingUp,
  MapPinned,
  ClockIcon,
  UserCircle2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { jobUtils } from '../../services/jobService'
import type { JobDetailsModalProps, Job } from '../../types/job'

interface JobWithExtras extends Job {
  job_responsibilities?: string[]
  job_summary?: string
  required_qualifications?: string[]
  preferred?: string[]
  compensation_and_benefits?: string[]
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply: _onApply,
  showApplyButton = true,
}) => {
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)

  if (!job) return null

  const handleApply = () => {
    setIsApplicationModalOpen(true)
  }

  const handleClose = () => {
    onClose()
  }

  const handleShare = () => {
    // TODO: Implement share functionality
  }

  const daysLeft = job.application_deadline
    ? Math.ceil((new Date(job.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[900px] mx-4 rounded-[20px]"
      showCloseButton={false}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden w-full max-w-[900px] p-0 flex flex-col rounded-[20px]">
        {/* Enhanced Header with subtle background */}
        <div className="bg-gradient-to-b from-background-subtle/80 to-background-surface px-12 py-12 border-b border-subtle relative">
          {/* Close Button - More prominent */}
          <button
            onClick={handleClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-background-subtle transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors" />
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
                  className="w-16 h-16 rounded-xl object-cover border border-default shadow-sm"
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

          {/* Enhanced Badges with icons */}
          <div className="flex flex-wrap gap-3">
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 hover:scale-105',
                {
                  'bg-ai-50 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 border-ai-200 dark:border-ai-800 hover:bg-ai-100 dark:hover:bg-ai-900/30':
                    job.level === 'Senior',
                  'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30':
                    job.level === 'Mid',
                  'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800 hover:bg-success-100 dark:hover:bg-success-900/30':
                    job.level === 'Junior',
                  'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30':
                    job.level === 'Lead',
                  'bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800 hover:bg-warning-100 dark:hover:bg-warning-900/30':
                    job.level === 'Principal',
                  'bg-background-subtle text-text-secondary border-default hover:bg-background-muted':
                    !['Senior', 'Mid', 'Junior', 'Lead', 'Principal'].includes(job.level as string),
                }
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
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Key Information Grid with dividers */}
          <div className="grid grid-cols-3 gap-10 mb-12 p-6 bg-background-subtle rounded-xl border border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary dark:text-primary-400" />
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

            <div className="flex items-center gap-3 border-l border-default pl-8 min-w-0">
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

            <div className="flex items-center gap-3 border-l border-default pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-ai-100 dark:bg-ai-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-ai dark:text-ai-400" />
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

          {/* Deadline Warning if applicable */}
          {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
            <div className="mb-10 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to apply
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Application deadline:{' '}
                  {job.application_deadline &&
                    new Date(job.application_deadline).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                </p>
              </div>
            </div>
          )}

          {/* About the Company - Enhanced */}
          {(() => {
            const organization = (
              job as unknown as {
                organization?: {
                  id?: string | number
                  name?: string
                  description?: string
                  website?: string
                  location_city?: string
                  location_country?: string
                  industry?: string
                  founded_year?: number
                }
              }
            ).organization

            const company = job.company || organization

            return (
              company && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                      About the Company
                    </h3>
                  </div>
                  <div className="pl-14">
                    {company.description ? (
                      <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                        {company.description}
                      </p>
                    ) : (
                      <p className="text-[15px] text-text-secondary leading-relaxed mb-6">
                        {company.name} is looking for talented individuals to join their team.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {(() => {
                        const location =
                          (company as { location?: string }).location ||
                          (organization &&
                          organization.location_city &&
                          organization.location_country
                            ? `${organization.location_city}, ${organization.location_country}`
                            : organization?.location_city || organization?.location_country)
                        return (
                          location && (
                            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-background-surface border border-border-default rounded-xl text-sm text-text-secondary hover:bg-background-subtle hover:border-border-strong transition-all duration-200 hover:scale-105">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{location}</span>
                            </button>
                          )
                        )
                      })()}
                      {company.industry && (
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-background-surface border border-border-default rounded-xl text-sm text-text-secondary hover:bg-background-subtle hover:border-border-strong transition-all duration-200 hover:scale-105">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{company.industry}</span>
                        </button>
                      )}
                      {company.website && (
                        <a
                          href={
                            company.website.startsWith('http')
                              ? company.website
                              : `https://${company.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-background-surface border border-border-default rounded-xl text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 hover:scale-105 font-medium"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Visit Website</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              )
            )
          })()}

          {/* Job Summary - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras
            return (
              (jobWithExtras.job_summary || job.description) && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-primary-600 dark:bg-primary-500 rounded-full" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                      <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                      Job Summary
                    </h3>
                  </div>
                  <div className="pl-14 prose prose-sm max-w-none">
                    <p className="text-[16px] text-text-secondary leading-[1.8] whitespace-pre-wrap">
                      {jobWithExtras.job_summary || job.description}
                    </p>
                  </div>
                </section>
              )
            )
          })()}

          {/* Job Responsibilities - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras
            return (
              jobWithExtras.job_responsibilities &&
              jobWithExtras.job_responsibilities.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-primary-600 dark:bg-primary-500 rounded-full" />
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
              )
            )
          })()}

          {/* Required Qualifications - Enhanced with checkmarks */}
          {(() => {
            const jobWithExtras = job as JobWithExtras
            const requiredQuals = jobWithExtras.required_qualifications || job.requirements
            return (
              requiredQuals &&
              requiredQuals.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-success-600 dark:bg-success-500 rounded-full" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/30">
                      <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                      Required Qualifications
                    </h3>
                  </div>
                  <div className="pl-14">
                    <ul className="space-y-3 list-disc list-inside">
                      {(jobWithExtras.required_qualifications || job.requirements || []).map(
                        (requirement: string, index: number) => (
                          <li
                            key={index}
                            className="text-[15px] text-text-secondary leading-relaxed pl-2"
                          >
                            {requirement}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </section>
              )
            )
          })()}

          {/* Preferred - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras
            const preferred = jobWithExtras.preferred || job.nice_to_have
            return (
              preferred &&
              Array.isArray(preferred) &&
              preferred.length > 0 && (
                <section className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-warning rounded-full" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-900/30">
                      <Sparkles className="w-5 h-5 text-warning dark:text-warning-400" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                      Preferred
                    </h3>
                  </div>
                  <div className="pl-14">
                    <ul className="space-y-3 list-disc list-inside">
                      {(jobWithExtras.preferred || job.nice_to_have || []).map(
                        (item: string, index: number) => (
                          <li
                            key={index}
                            className="text-[15px] text-text-secondary leading-relaxed pl-2"
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </section>
              )
            )
          })()}

          {/* Compensation & Benefits - Enhanced */}
          {(() => {
            const jobWithExtras = job as JobWithExtras
            const benefits = jobWithExtras.compensation_and_benefits || job.benefits
            return (
              benefits &&
              Array.isArray(benefits) &&
              benefits.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-ai rounded-full" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-ai-50 dark:bg-ai-900/30">
                      <Sparkles className="w-5 h-5 text-ai dark:text-ai-400" />
                    </div>
                    <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                      Compensation & Benefits
                    </h3>
                  </div>
                  <div className="pl-14">
                    <ul className="space-y-3 list-disc list-inside">
                      {(jobWithExtras.compensation_and_benefits || job.benefits || []).map(
                        (benefit: string, index: number) => (
                          <li
                            key={index}
                            className="text-[15px] text-text-secondary leading-relaxed pl-2"
                          >
                            {benefit}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </section>
              )
            )
          })()}
        </div>

        {/* Sticky Footer with CTAs */}
        <div className="border-t border-default bg-background-surface px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="h-12 px-5 border-2 hover:bg-background-subtle hover:border-strong transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {showApplyButton && (
            <Button
              onClick={handleApply}
              size="lg"
              className="h-12 px-8 text-base font-semibold btn-primary-gradient transition-all duration-200 hover:scale-105 active:scale-95 group"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </DialogContent>
      <ApplicationModal
        job={job}
        isOpen={isApplicationModalOpen}
        onClose={() => {
          setIsApplicationModalOpen(false)
          // Optionally close the details modal too after successful application
          // onClose();
        }}
      />
    </Dialog>
  )
}
