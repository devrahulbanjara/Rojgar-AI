import React, { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'
import { ResumeDetailModal } from './ResumeDetailModal'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui'

interface ShortlistCandidateCardProps {
  candidate: ShortlistCandidate
  onShortlist: (applicationId: string) => void
  onReject: (applicationId: string) => void
  className?: string
  showJobTitle?: boolean
  scoreInterpretation?: {
    text: string
    color: string
  }
  showScores?: boolean
  isShortlistingInProgress?: boolean
  isFinalized?: boolean
}

export function ShortlistCandidateCard({
  candidate,
  onShortlist,
  onReject,
  className,
  showJobTitle = false,
  scoreInterpretation,
  showScores = true,
  isShortlistingInProgress = false,
  isFinalized = false,
}: ShortlistCandidateCardProps) {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)
  const getScoreStyles = (score: number) => {
    if (score < 50) {
      return {
        scoreColor: 'text-error-600 dark:text-error-400',
        bgColor:
          'from-error-50/80 via-error-50/40 to-error-50/60 dark:from-error-950/30 dark:via-error-950/20 dark:to-error-950/30',
        borderColor: 'border-error-200/60 dark:border-error-800/60',
      }
    } else if (score >= 50 && score < 70) {
      return {
        scoreColor: 'text-warning-600 dark:text-warning-400',
        bgColor:
          'from-warning-50/80 via-warning-50/40 to-warning-50/60 dark:from-warning-950/30 dark:via-warning-950/20 dark:to-warning-950/30',
        borderColor: 'border-warning-200/60 dark:border-warning-800/60',
      }
    } else {
      return {
        scoreColor: 'text-primary-600 dark:text-primary-400',
        bgColor:
          'from-primary-50/80 via-primary-50/40 to-primary-50/60 dark:from-primary-950/30 dark:via-primary-950/20 dark:to-primary-950/30',
        borderColor: 'border-primary-200/60 dark:border-primary-800/60',
      }
    }
  }

  const scoreStyles = getScoreStyles(candidate.score)

  // Check if candidate is already processed
  const isShortlisted = candidate.current_status === 'shortlisted'
  const isRejected = candidate.current_status === 'rejected'
  const isProcessed = isShortlisted || isRejected

  return (
    <div
      className={cn(
        'group w-full bg-background-surface rounded-2xl border border-border-default p-6 shadow-sm hover:shadow-md transition-shadow',
        isRejected && 'opacity-70',
        className
      )}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
            <AvatarImage src={candidate.picture || undefined} />
            <AvatarFallback className="bg-background-subtle text-text-secondary font-bold">
              {candidate.name
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-text-primary leading-tight">
                {candidate.name}
              </h3>
              {isShortlisted && (
                <Badge
                  colorPalette="blue"
                  className="text-xs px-2 py-0.5"
                  style={{ borderRadius: '5px' }}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Shortlisted
                </Badge>
              )}
              {isRejected && (
                <Badge
                  colorPalette="red"
                  className="text-xs px-2 py-0.5"
                  style={{ borderRadius: '5px' }}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>

            {showJobTitle && (
              <p className="text-sm text-text-secondary font-medium">
                Applied for: {candidate.job_title}
              </p>
            )}
            {candidate.professional_headline && (
              <p className="text-sm text-text-secondary">{candidate.professional_headline}</p>
            )}
            <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-wider">
              Applied{' '}
              {new Date(candidate.applied_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {showScores && (
          <div className="flex-shrink-0 text-center px-6 border-x border-border-default/50">
            {isShortlistingInProgress && !candidate.score ? (
              <>
                <Loader2 className="w-7 h-7 text-primary-500 animate-spin mx-auto" />
                <div className="text-[10px] text-primary-600 font-bold tracking-tight mt-1.5">
                  Analyzing...
                </div>
              </>
            ) : (
              <>
                <div className={cn('text-2xl font-bold leading-none', scoreStyles.scoreColor)}>
                  {candidate.score}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-tight text-text-tertiary mt-1.5">
                  {scoreInterpretation?.text || 'Match Score'}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="px-5 py-2.5 border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            View Resume
          </button>
          {!isProcessed && !isFinalized && (
            <>
              <Button
                size="sm"
                className="h-9 px-5 bg-primary-600 hover:bg-primary-700 text-[13px] font-semibold"
                onClick={() => onShortlist(candidate.application_id)}
              >
                Shortlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-5 text-text-secondary border-border-default bg-transparent text-[13px] font-semibold hover:text-error-600 hover:border-error-200 hover:bg-error-50"
                onClick={() => onReject(candidate.application_id)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {showScores && candidate.feedback && (
        <div className="mt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="analysis"
              className="border-none bg-background-subtle/40 rounded-xl"
            >
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline border-t border-border-subtle/50 rounded-b-none">
                <div className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-tight">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  AI Feedback
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 pt-1">
                <div className="border-l border-border-default pl-4">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {candidate.feedback}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <ResumeDetailModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        applicationId={candidate.application_id}
        candidateName={candidate.name}
        candidatePhoto={candidate.picture}
        candidateSocialLinks={candidate.social_links}
      />
    </div>
  )
}
