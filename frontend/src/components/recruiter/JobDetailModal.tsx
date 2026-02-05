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
  const jobId = job ? (job.job_id || job.id?.toString() || null) : null
  const { autoShortlist, isLoading: isLoadingAutoShortlist, toggle, isToggling } = useAutoShortlist(jobId)

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
      <div className="max-h-[90vh] overflow-hidden w-full max-w-[900px] p-0 flex flex-col rounded-[20px] bg-white">
        {/* Enhanced Header with subtle background */}
        <div className="bg-gradient-to-b from-gray-50/80 to-white px-12 py-12 border-b border-gray-100 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
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
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-[28px] font-bold text-gray-900 leading-tight mb-2">
                {job.title}
              </h2>
              <p className="text-lg text-gray-600 font-medium tracking-[0.3px]">
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
                    'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  )}
                >
                  {job.department}
                </Badge>
              )}
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-blue-50 text-blue-700 hover:bg-blue-100'
                )}
              >
                <UserCircle2 className="w-4 h-4 mr-1.5" />
                {job.level}
              </Badge>
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                )}
              >
                <MapPinned className="w-4 h-4 mr-1.5" />
                {job.location_type}
              </Badge>
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-purple-50 text-purple-700 hover:bg-purple-100'
                )}
              >
                <ClockIcon className="w-4 h-4 mr-1.5" />
                {job.employment_type}
              </Badge>
              {job.applicant_count !== undefined && job.applicant_count > 0 && (
                <Badge
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                    'bg-orange-50 text-orange-700 hover:bg-orange-100'
                  )}
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  {job.applicant_count} applicants
                </Badge>
              )}
            </div>

            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 group relative">
              <Zap className={cn(
                "w-4 h-4 transition-colors",
                autoShortlist ? "text-orange-600" : "text-gray-400"
              )} />
              <span className="text-sm font-medium text-gray-900">Auto Shortlist</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoShortlist}
                  onChange={toggle}
                  disabled={isLoadingAutoShortlist || isToggling || !jobId}
                  className="sr-only peer"
                />
                <div className="w-5 h-3 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-2 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-orange-600" />
              </label>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Key Information Grid with dividers */}
          <div className="grid grid-cols-3 gap-10 mb-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
                  Location
                </p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {job.location_city && job.location_country
                    ? `${job.location_city}, ${job.location_country}`
                    : job.location_city || job.location_country || job.location || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Salary</p>
                <p className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatJobSalary(job)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-8 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">Posted</p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                  {jobUtils.formatPostedDate(job.created_at || job.posted_date)}
                </p>
              </div>
            </div>
          </div>

          {/* About the Company - Enhanced */}
          {job.company && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-blue-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  About the Company
                </h3>
              </div>
              <div className="pl-14">
                {job.company.description ? (
                  <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                    {job.company.description}
                  </p>
                ) : (
                  <p className="text-[15px] text-gray-700 leading-relaxed mb-6">
                    {job.company.name} is looking for talented individuals to join their team.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {job.company.location && (
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{job.company.location}</span>
                    </button>
                  )}
                  {job.company.industry && (
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105">
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
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105 font-medium"
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
                <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  Job Summary
                </h3>
              </div>
              <div className="pl-14 prose prose-sm max-w-none">
                <p className="text-[16px] text-gray-700 leading-[1.8] whitespace-pre-wrap">
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
                  <div className="w-1 h-8 bg-blue-600 rounded-full" />
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                    Job Responsibilities
                  </h3>
                </div>
                <div className="pl-14">
                  <ul className="space-y-3 list-disc list-inside">
                    {jobWithExtras.job_responsibilities.map((resp: string, index: number) => (
                      <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
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
                <div className="w-1 h-8 bg-emerald-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  Required Qualifications
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
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
                <div className="w-1 h-8 bg-amber-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  Preferred
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.nice_to_have.map((item, index) => (
                    <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
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
                <div className="w-1 h-8 bg-violet-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-50">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  Compensation & Benefits
                </h3>
              </div>
              <div className="pl-14">
                <ul className="space-y-3 list-disc list-inside">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="text-[15px] text-gray-700 leading-relaxed pl-2">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

        </div>

        {/* Sticky Footer with Edit, Expire, Delete, and Save as Template Buttons */}
        <div className="border-t border-gray-200 bg-white px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            {onDelete && (
              <Button
                onClick={handleDelete}
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-semibold border-red-300 text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
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
                  className="h-12 px-8 text-base font-semibold border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
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
                className="h-12 px-8 text-base font-semibold border-amber-300 text-amber-700 hover:bg-amber-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
              >
                <Ban className="w-5 h-5 mr-2" />
                Expire Job
              </Button>
            )}
            <Button
              onClick={handleEdit}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
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
