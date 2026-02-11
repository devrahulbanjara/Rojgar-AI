import React, { useState } from 'react'
import { ApplicationModal } from './ApplicationModal'
import { Dialog, DialogContent } from '../ui/dialog'
import { ActionButton } from '../ui'
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
  Share2,
} from 'lucide-react'
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

  const handleShare = () => {}

  const daysLeft = job.application_deadline
    ? Math.ceil((new Date(job.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-3xl mx-4"
      showCloseButton={false}
    >
      <DialogContent className="max-h-[85vh] overflow-hidden w-full max-w-3xl p-0 flex flex-col bg-background-surface rounded-[5px]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 pb-8">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1 flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">{job.title}</h2>
                <p className="text-text-secondary font-medium">
                  {job.company?.name ||
                    (job as unknown as { organization?: { name?: string } }).organization?.name ||
                    'Company'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Standardized Badges */}
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

            {/* Key Info Row */}
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

            {/* Deadline Alert */}
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

            {/* Content Sections with clean left border design */}
            <div className="space-y-8">
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
                    <Section icon={<Building2 className="w-4 h-4" />} title="About the Company">
                      <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {company.description ||
                          `${company.name} is looking for talented individuals to join their team.`}
                      </p>
                      {(company.website || company.location || company.industry) && (
                        <div className="flex gap-3 mt-4">
                          {company.website && (
                            <a
                              href={
                                company.website.startsWith('http')
                                  ? company.website
                                  : `https://${company.website}`
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
                  )
                )
              })()}

              {(() => {
                const jobWithExtras = job as JobWithExtras
                return (
                  (jobWithExtras.job_summary || job.description) && (
                    <Section icon={<Briefcase className="w-4 h-4" />} title="Job Summary">
                      <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {jobWithExtras.job_summary || job.description}
                      </p>
                    </Section>
                  )
                )
              })()}

              {(() => {
                const jobWithExtras = job as JobWithExtras
                return (
                  jobWithExtras.job_responsibilities &&
                  jobWithExtras.job_responsibilities.length > 0 && (
                    <Section icon={<Briefcase className="w-4 h-4" />} title="Responsibilities">
                      <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {jobWithExtras.job_responsibilities.map((resp: string, index: number) => (
                          <li key={index}>{resp}</li>
                        ))}
                      </ul>
                    </Section>
                  )
                )
              })()}

              {(() => {
                const jobWithExtras = job as JobWithExtras
                const requiredQuals = jobWithExtras.required_qualifications || job.requirements
                return (
                  requiredQuals &&
                  requiredQuals.length > 0 && (
                    <Section
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      title="Required Qualifications"
                    >
                      <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {(jobWithExtras.required_qualifications || job.requirements || []).map(
                          (requirement: string, index: number) => (
                            <li key={index}>{requirement}</li>
                          )
                        )}
                      </ul>
                    </Section>
                  )
                )
              })()}

              {(() => {
                const jobWithExtras = job as JobWithExtras
                const preferred = jobWithExtras.preferred || job.nice_to_have
                return (
                  preferred &&
                  Array.isArray(preferred) &&
                  preferred.length > 0 && (
                    <Section icon={<Sparkles className="w-4 h-4" />} title="Preferred">
                      <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {(jobWithExtras.preferred || job.nice_to_have || []).map(
                          (item: string, index: number) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </Section>
                  )
                )
              })()}

              {(() => {
                const jobWithExtras = job as JobWithExtras
                const benefits = jobWithExtras.compensation_and_benefits || job.benefits
                return (
                  benefits &&
                  Array.isArray(benefits) &&
                  benefits.length > 0 && (
                    <Section icon={<Sparkles className="w-4 h-4" />} title="Compensation & Benefits">
                      <ul className="list-disc list-inside space-y-2 ml-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {(jobWithExtras.compensation_and_benefits || job.benefits || []).map(
                          (benefit: string, index: number) => (
                            <li key={index}>{benefit}</li>
                          )
                        )}
                      </ul>
                    </Section>
                  )
                )
              })()}
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="border-t border-border-default bg-slate-50/50 dark:bg-slate-900/30 px-10 py-6 flex items-center justify-between rounded-b-[5px]">
          <div className="flex items-center gap-3">
            <ActionButton
              onClick={handleShare}
              variant="ghost"
              size="md"
              className="text-slate-600 dark:text-slate-400"
            >
              <Share2 className="w-4 h-4" />
              Share
            </ActionButton>
          </div>

          {showApplyButton && (
            <ActionButton onClick={handleApply} variant="primary" size="md" className="px-8">
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </ActionButton>
          )}
        </div>
      </DialogContent>
      <ApplicationModal
        job={job}
        isOpen={isApplicationModalOpen}
        onClose={() => {
          setIsApplicationModalOpen(false)
        }}
      />
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
