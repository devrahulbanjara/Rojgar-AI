import React from 'react'
import { CandidateApplication } from '../../types/candidate'
import { cn } from '../../lib/utils'
import { Dialog } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  X,
  Briefcase,
  Calendar,
  Star,
  Mail,
  ExternalLink,
  Clock,
  UserCircle2,
  Phone,
  Globe,
} from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import { formatDistanceToNow, format } from 'date-fns'
import { UserAvatar } from '../ui/UserAvatar'

interface CandidateDetailModalProps {
  candidate: CandidateApplication | null
  isOpen: boolean
  onClose: () => void
}

const getStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'applied':
      return 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    case 'interviewing':
      return 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
    case 'outcome':
      return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    default:
      return 'bg-slate-50 text-slate-700 hover:bg-slate-100'
  }
}

export function CandidateDetailModal({ candidate, isOpen, onClose }: CandidateDetailModalProps) {
  if (!candidate) return null

  const appliedDate = new Date(candidate.applied_at)
  const timeAgo = formatDistanceToNow(appliedDate, { addSuffix: true })
  const formattedDate = format(appliedDate, 'MMM dd, yyyy')

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

          {/* Candidate Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <UserAvatar
                name={candidate.name}
                src={candidate.picture || undefined}
                className="w-16 h-16 border border-gray-200 shadow-sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[28px] font-bold text-gray-900 leading-tight">
                  {candidate.name}
                </h2>
                {candidate.professional_headline && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-lg text-gray-600 font-medium">
                      {candidate.professional_headline}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Badges with icons */}
          <div className="flex flex-wrap gap-3">
            {candidate.job_title && (
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-blue-50 text-blue-700 hover:bg-blue-100'
                )}
              >
                <Briefcase className="w-4 h-4 mr-1.5" />
                {candidate.job_title}
              </Badge>
            )}
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                getStatusColors(candidate.current_status)
              )}
            >
              <UserCircle2 className="w-4 h-4 mr-1.5" />
              {candidate.current_status.charAt(0).toUpperCase() + candidate.current_status.slice(1)}
            </Badge>
            <Badge
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                'bg-purple-50 text-purple-700 hover:bg-purple-100'
              )}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Applied {timeAgo}
            </Badge>
            {candidate.ai_score && (
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-orange-50 text-orange-700 hover:bg-orange-100'
                )}
              >
                <Star className="w-4 h-4 mr-1.5" />
                AI Score: {candidate.ai_score}
              </Badge>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12">
          {/* Key Information Grid with dividers */}
          <div className="mb-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
            {/* Single Row: Application Date and Contact */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
                    Application Date
                  </p>
                  <p className="text-sm font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-gray-200 pl-6 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium mb-0.5 whitespace-nowrap">
                    Contact
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="text-sm font-semibold text-gray-900 break-all hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      title={candidate.email}
                    >
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-all">{candidate.email}</span>
                    </a>
                    {candidate.phone && (
                      <>
                        <span className="text-gray-300">|</span>
                        <a
                          href={`tel:${candidate.phone}`}
                          className="text-sm font-semibold text-gray-900 break-all hover:text-blue-600 transition-colors flex items-center gap-1.5"
                          title={candidate.phone}
                        >
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="break-all">{candidate.phone}</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Horizontal Social Links Cards */}
            {candidate.social_links && candidate.social_links.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidate.social_links.map(link => {
                  const getSocialIcon = (type: string) => {
                    const iconType = type.toLowerCase()
                    if (iconType.includes('linkedin')) {
                      return <SiLinkedin className="w-6 h-6" style={{ color: '#0A66C2' }} />
                    }
                    if (iconType.includes('github')) {
                      return <SiGithub className="w-6 h-6" style={{ color: '#24292e' }} />
                    }
                    // Portfolio/Website
                    return <Globe className="w-6 h-6" style={{ color: '#6366F1' }} />
                  }

                  const getPlatformName = (type: string) => {
                    const iconType = type.toLowerCase()
                    if (iconType.includes('linkedin')) {
                      return 'LinkedIn'
                    }
                    if (iconType.includes('github')) {
                      return 'GitHub'
                    }
                    return 'Portfolio'
                  }

                  const cleanUrl = link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')

                  return (
                    <a
                      key={link.social_link_id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-15 p-3 bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-50/50 active:scale-[0.98]"
                    >
                      {/* Content Layout */}
                      <div className="flex items-center gap-3 h-full">
                        {/* Icon */}
                        <div className="flex-shrink-0">{getSocialIcon(link.type)}</div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-gray-900">
                            {getPlatformName(link.type)}
                          </div>
                          <div className="text-xs text-gray-600 truncate">{cleanUrl}</div>
                        </div>
                      </div>

                      {/* External Link Icon - Top Right */}
                      <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {candidate.professional_summary && (
            <section className="mb-12">
              <p className="text-[15px] text-gray-700 leading-relaxed">
                {candidate.professional_summary}
              </p>
            </section>
          )}

          {/* AI Analysis - Enhanced */}
          {candidate.ai_analysis && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-amber-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-[22px] font-semibold text-gray-900 tracking-[0.5px]">
                  AI Analysis
                </h3>
              </div>
              <div className="pl-14">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                  <p className="text-[15px] text-gray-700 leading-relaxed">
                    {candidate.ai_analysis}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer with CTAs */}
        <div className="border-t border-gray-200 bg-white px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="h-12 px-5 border-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Close
            </Button>
          </div>

          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
          >
            View Full Profile
            <ExternalLink className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
