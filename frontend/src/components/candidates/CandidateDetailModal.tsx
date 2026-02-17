import React from 'react'
import { CandidateApplication } from '../../types/candidate'
import { Dialog } from '../ui/dialog'
import { Badge } from '../ui/badge'
import { ActionButton } from '../ui'
import {
  X,
  Briefcase,
  Calendar,
  Star,
  Mail,
  ExternalLink,
  Clock,
  Phone,
  Globe,
  FileText,
} from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import { formatDistanceToNow, format } from 'date-fns'
import { UserAvatar } from '../ui/UserAvatar'

interface CandidateDetailModalProps {
  candidate: CandidateApplication | null
  isOpen: boolean
  onClose: () => void
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
      className="max-w-4xl mx-4"
      showCloseButton={false}
    >
      <div className="max-h-[85vh] overflow-hidden w-full max-w-4xl p-0 flex flex-col bg-background-surface rounded-[5px]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 pb-8">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1 flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">{candidate.name}</h2>
                {candidate.professional_headline && (
                  <p className="text-text-secondary font-medium">{candidate.professional_headline}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Standardized Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {candidate.job_title && (
                <Badge className="bg-primary-600 hover:bg-primary-700 text-white border-0 text-[14px] font-medium">
                  {candidate.job_title}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                {candidate.current_status.charAt(0).toUpperCase() + candidate.current_status.slice(1)}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium"
              >
                Applied {timeAgo}
              </Badge>
              {candidate.score && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 text-[14px] font-medium font-mono"
                >
                  AI Score: {candidate.score}
                </Badge>
              )}
            </div>

            {/* Key Info Row */}
            <div className="grid grid-cols-3 gap-6 p-6 rounded-xl border border-border-default bg-slate-50/50 dark:bg-slate-900/30 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center">
                  <Calendar className="w-[18px] h-[18px] text-primary-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Applied
                  </p>
                  <p className="text-[14px] font-medium text-slate-900 dark:text-slate-50">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-border-default pl-6 min-w-0">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center">
                  <Mail className="w-[18px] h-[18px] text-primary-600" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Email
                  </p>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="text-[14px] font-medium text-slate-900 dark:text-slate-50 hover:text-primary-600 transition-colors truncate block"
                    title={candidate.email}
                  >
                    {candidate.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-l border-border-default pl-6">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center">
                  <Phone className="w-[18px] h-[18px] text-primary-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.5px] font-semibold text-slate-500 dark:text-slate-400">
                    Phone
                  </p>
                  <p className="text-[14px] font-medium text-slate-900 dark:text-slate-50">
                    {candidate.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Sections with clean left border design */}
            <div className="space-y-8">
              {candidate.professional_summary && (
                <Section icon={<FileText className="w-4 h-4" />} title="Professional Summary">
                  <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {candidate.professional_summary}
                  </p>
                </Section>
              )}

              {candidate.social_links && candidate.social_links.length > 0 && (
                <Section icon={<Globe className="w-4 h-4" />} title="Social Links">
                  <div className="space-y-2">
                    {candidate.social_links.map(link => {
                      const getSocialIcon = (type: string) => {
                        const iconType = type.toLowerCase()
                        if (iconType.includes('linkedin')) {
                          return <SiLinkedin className="w-4 h-4 text-social-linkedin" />
                        }
                        if (iconType.includes('github')) {
                          return <SiGithub className="w-4 h-4 text-social-github" />
                        }
                        return <Globe className="w-4 h-4 text-primary-600" />
                      }

                      const getPlatformName = (type: string) => {
                        const iconType = type.toLowerCase()
                        if (iconType.includes('linkedin')) return 'LinkedIn'
                        if (iconType.includes('github')) return 'GitHub'
                        return 'Portfolio'
                      }

                      return (
                        <a
                          key={link.social_link_id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[15px] text-slate-600 dark:text-slate-400 hover:text-primary-600 transition-colors"
                        >
                          {getSocialIcon(link.type)}
                          <span>{getPlatformName(link.type)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )
                    })}
                  </div>
                </Section>
              )}

              {candidate.feedback && (
                <Section icon={<Star className="w-4 h-4" />} title="AI Analysis">
                  <div className="bg-ai-50 dark:bg-ai-900/20 border border-ai-200 dark:border-ai-700 border-l-[3px] border-l-ai-500 rounded-xl p-6">
                    <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                      {candidate.feedback}
                    </p>
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="border-t border-border-default bg-slate-50/50 dark:bg-slate-900/30 px-10 py-6 flex items-center justify-between rounded-b-[5px]">
          <div className="flex items-center gap-3">
            <ActionButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="text-slate-600 dark:text-slate-400"
            >
              Close
            </ActionButton>
          </div>

          <ActionButton variant="primary" size="md" className="px-8">
            View Full Profile
            <ExternalLink className="w-4 h-4" />
          </ActionButton>
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
