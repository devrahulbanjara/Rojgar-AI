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
      return 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30'
    case 'interviewing':
      return 'bg-ai-50 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 hover:bg-ai-100 dark:hover:bg-ai-900/30'
    case 'outcome':
      return 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 hover:bg-success-100 dark:hover:bg-success-900/30'
    default:
      return 'bg-background-subtle text-text-tertiary hover:bg-background-muted'
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
      <div className="max-h-[90vh] overflow-hidden w-full max-w-[900px] p-0 flex flex-col rounded-[20px] bg-background-surface">
        {/* Enhanced Header with subtle background */}
        <div className="bg-gradient-to-b from-background-subtle/80 to-background-surface px-12 py-12 border-b border-border-subtle dark:border-border-default relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-background-subtle transition-all duration-200 hover:scale-110 active:scale-95 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
          </button>

          {/* Candidate Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <UserAvatar
                name={candidate.name}
                src={candidate.picture || undefined}
                className="w-16 h-16 border border-border-default shadow-sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[28px] font-bold text-text-primary leading-tight">
                  {candidate.name}
                </h2>
                {candidate.professional_headline && (
                  <>
                    <span className="text-border-strong">|</span>
                    <span className="text-lg text-text-secondary font-medium">
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
                  'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
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
                'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
              )}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Applied {timeAgo}
            </Badge>
            {candidate.ai_score && (
              <Badge
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-full border-0 transition-all duration-200 hover:scale-105',
                  'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
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
          <div className="mb-12 p-6 bg-background-subtle dark:bg-background-surface rounded-xl border border-border-subtle dark:border-border-default">
            {/* Single Row: Application Date and Contact */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-tertiary font-medium mb-0.5 whitespace-nowrap">
                    Application Date
                  </p>
                  <p className="text-sm font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-border-default dark:border-border-strong pl-6 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-ai-100 dark:bg-ai-900/30 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-ai-600 dark:text-ai-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-tertiary font-medium mb-0.5 whitespace-nowrap">
                    Contact
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`mailto:${candidate.email}`}
                      className="text-sm font-semibold text-text-primary break-all hover:text-primary-600 transition-colors flex items-center gap-1.5"
                      title={candidate.email}
                    >
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="break-all">{candidate.email}</span>
                    </a>
                    {candidate.phone && (
                      <>
                        <span className="text-border-strong">|</span>
                        <a
                          href={`tel:${candidate.phone}`}
                          className="text-sm font-semibold text-text-primary break-all hover:text-primary-600 transition-colors flex items-center gap-1.5"
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
                      return <SiLinkedin className="w-6 h-6 text-social-linkedin" />
                    }
                    if (iconType.includes('github')) {
                      return <SiGithub className="w-6 h-6 text-social-github" />
                    }
                    // Portfolio/Website
                    return <Globe className="w-6 h-6 text-primary-600" />
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
                      className="group relative h-15 p-3 bg-background-subtle dark:bg-background-surface border border-border-default dark:border-border-default rounded-lg transition-all duration-200 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/30 active:scale-[0.98]"
                    >
                      {/* Content Layout */}
                      <div className="flex items-center gap-3 h-full">
                        {/* Icon */}
                        <div className="flex-shrink-0">{getSocialIcon(link.type)}</div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-text-primary">
                            {getPlatformName(link.type)}
                          </div>
                          <div className="text-xs text-text-secondary truncate">{cleanUrl}</div>
                        </div>
                      </div>

                      {/* External Link Icon - Top Right */}
                      <ExternalLink className="absolute top-2 right-2 w-3.5 h-3.5 text-text-muted group-hover:text-primary-600 transition-colors" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Professional Summary */}
          {candidate.professional_summary && (
            <section className="mb-12 p-6 bg-background-subtle dark:bg-background-surface rounded-xl border border-border-subtle dark:border-border-default">
              <p className="text-[15px] text-text-secondary leading-relaxed">
                {candidate.professional_summary}
              </p>
            </section>
          )}

          {/* AI Analysis - Enhanced */}
          {candidate.ai_analysis && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-warning-600 rounded-full" />
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-warning-50 dark:bg-warning-900/30">
                  <Star className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                </div>
                <h3 className="text-[22px] font-semibold text-text-primary tracking-[0.5px]">
                  AI Analysis
                </h3>
              </div>
              <div className="pl-14">
                <div className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950/30 dark:to-warning-900/30 border border-warning-200 dark:border-warning-700 rounded-xl p-6">
                  <p className="text-[15px] text-text-secondary leading-relaxed">
                    {candidate.ai_analysis}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Footer with CTAs */}
        <div className="border-t border-border-default bg-background-surface px-12 py-6 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="h-12 px-5 border-2 hover:bg-background-subtle hover:border-border-strong transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Close
            </Button>
          </div>

          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl group"
          >
            View Full Profile
            <ExternalLink className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
