import React, { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'
import { ResumeDetailModal } from './ResumeDetailModal'
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui'

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
        scoreColor: 'text-success-600 dark:text-success-400',
        bgColor:
          'from-success-50/80 via-success-50/40 to-success-50/60 dark:from-success-950/30 dark:via-success-950/20 dark:to-success-950/30',
        borderColor: 'border-success-200/60 dark:border-success-800/60',
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
        isShortlisted && 'border-success-200 bg-success-50/20',
        isRejected && 'border-warning-200 bg-warning-50/20 opacity-70',
        className
      )}
    >
      <div className="flex items-start gap-6">
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
                  colorPalette="green"
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
          <div className="flex-shrink-0 text-center px-6 border-x">
            {isShortlistingInProgress && !candidate.score ? (
              <>
                <Loader2 className="w-8 h-8 text-ai-500 animate-spin mx-auto" />
                <div className="text-xs text-ai-600 font-semibold tracking-wide mt-1">
                  Analyzing...
                </div>
              </>
            ) : (
              <>
                <div
                  className={cn('text-4xl font-black leading-none', scoreStyles.scoreColor)}
                >
                  {candidate.score}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mt-1">
                  {scoreInterpretation?.text || 'Match Score'}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="px-5 py-2.5 border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            View Resume
          </button>
          {!isProcessed && (
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
            <AccordionItem value="analysis" className="border-none bg-background-subtle/60 rounded-b-2xl">
              <AccordionTrigger className="px-4 py-3 hover:no-underline border-t border-border-subtle rounded-b-none">
                <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary uppercase tracking-widest">
                  <FileText className="w-4 h-4 text-purple-500" />
                  AI Analysis & Feedback
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-8 pb-6 pt-2">
                <div className="relative pl-6 border-l-2 border-ai-300">
                  <p className="text-[14px] leading-relaxed text-text-secondary italic">
                    "{candidate.feedback}"
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
