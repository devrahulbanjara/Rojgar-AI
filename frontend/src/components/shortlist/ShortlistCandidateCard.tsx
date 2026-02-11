import React, { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, Brain, FileText, Loader2 } from 'lucide-react'
import { UserAvatar } from '../ui/UserAvatar'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'
import { ResumeDetailModal } from './ResumeDetailModal'

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
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false)
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
        'group w-full bg-white dark:bg-[#0F172A] rounded-[16px] border border-[#E2E8F0] dark:border-[#1E293B] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        isShortlisted && 'border-success-200 dark:border-success-800 bg-success-50/20 dark:bg-success-950/20',
        isRejected && 'border-error-200 dark:border-error-800 bg-error-50/20 dark:bg-error-950/20 opacity-60',
        className
      )}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <UserAvatar
              name={candidate.name}
              src={candidate.picture || undefined}
              className="w-[72px] h-[72px]"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary leading-[1.2]">
                {candidate.name}
              </h3>
              {isShortlisted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs font-medium rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Shortlisted
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 text-xs font-medium rounded-full">
                  <XCircle className="w-3 h-3" />
                  Rejected
                </span>
              )}
            </div>
            {showJobTitle && (
              <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                Applied for: {candidate.job_title}
              </div>
            )}
            {candidate.professional_headline && (
              <div className="text-sm text-text-secondary">{candidate.professional_headline}</div>
            )}
            <div className="text-xs text-text-tertiary mt-1">
              Applied{' '}
              {new Date(candidate.applied_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {showScores && (
          <div className="flex-shrink-0 flex flex-col items-center gap-1 text-center w-24">
            {isShortlistingInProgress && !candidate.score ? (
              <>
                <Loader2 className="w-8 h-8 text-ai-500 animate-spin" />
                <div className="text-xs text-ai-600 dark:text-ai-400 font-mono font-medium tracking-wide">
                  Analyzing...
                </div>
              </>
            ) : (
              <>
                <div
                  className={`text-3xl font-mono font-bold ${scoreStyles.scoreColor} leading-none`}
                >
                  {candidate.score}
                </div>
                <div className="text-xs text-text-tertiary font-mono font-medium tracking-wide uppercase">
                  Score
                </div>
                {scoreInterpretation && (
                  <div
                    className={`text-xs font-semibold ${scoreInterpretation.color}`}
                    style={{ fontWeight: 600 }}
                  >
                    {scoreInterpretation.text}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="px-5 py-2.5 border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
          >
            View Resume
          </button>
          {!isProcessed && (
            <>
              <button
                onClick={() => onShortlist(candidate.application_id)}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95"
              >
                Shortlist
              </button>
              <button
                onClick={() => onReject(candidate.application_id)}
                className="px-5 py-2.5 border-2 border-[#E2E8F0] text-text-secondary hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {showScores && candidate.feedback && (
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <button
            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
            className="group w-full flex items-center justify-between p-4 rounded-xl bg-ai-50 dark:bg-ai-900/20 hover:bg-ai-100 dark:hover:bg-ai-900/30 border border-ai-200 dark:border-ai-800 hover:border-ai-300 dark:hover:border-ai-700 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-ai-100 dark:bg-ai-900/30 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-ai-600 dark:text-ai-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-text-primary">AI Analysis & Feedback</div>
                <div className="text-xs text-text-tertiary mt-0.5 font-mono">
                  {isAnalysisExpanded ? 'Click to collapse' : 'Click to view detailed feedback'}
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-ai-500 transition-all duration-300',
                isAnalysisExpanded && 'rotate-180'
              )}
            />
          </button>

          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isAnalysisExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
            )}
          >
            <div className="relative p-6 bg-ai-50 dark:bg-ai-900/20 rounded-2xl border-l-[3px] border-l-ai-500">
              <p className="font-mono text-sm text-text-secondary leading-relaxed mb-0">
                {candidate.feedback}
              </p>
            </div>
          </div>
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
