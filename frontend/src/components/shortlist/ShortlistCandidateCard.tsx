import React, { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, Brain, FileText } from 'lucide-react'
import { UserAvatar } from '../ui/UserAvatar'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'
import { ResumeDetailModal } from './ResumeDetailModal'

interface ShortlistCandidateCardProps {
  candidate: ShortlistCandidate
  onApprove: (candidateId: string) => void
  onReject: (candidateId: string) => void
  className?: string
  showJobTitle?: boolean
  scoreInterpretation?: {
    text: string
    color: string
  }
}

export function ShortlistCandidateCard({
  candidate,
  onApprove,
  onReject,
  className,
  showJobTitle = false,
  scoreInterpretation,
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

  const scoreStyles = getScoreStyles(candidate.ai_score)

  return (
    <div
      className={cn(
        'group w-full bg-background-surface rounded-[12px] border border-border-subtle p-6 shadow-sm hover:border-border-default hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
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
            <h3 className="text-lg font-semibold text-text-primary leading-[1.2]">
              {candidate.name}
            </h3>
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

        <div className="flex-shrink-0 flex flex-col items-center gap-1 text-center w-24">
          <div className={`text-3xl font-bold ${scoreStyles.scoreColor} leading-none`}>
            {candidate.ai_score}
          </div>
          <div className="text-xs text-text-tertiary font-medium">AI Score</div>
          {scoreInterpretation && (
            <div
              className={`text-xs font-semibold ${scoreInterpretation.color}`}
              style={{ fontWeight: 600 }}
            >
              {scoreInterpretation.text}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-4">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="group inline-flex items-center gap-2 px-5 py-3 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:shadow-primary/20 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
          >
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>View Resume</span>
          </button>
          <button
            onClick={() => onApprove(candidate.candidate_id)}
            className="group inline-flex items-center gap-2 px-5 py-3 bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800 hover:bg-success-100 dark:hover:bg-success-900/30 hover:border-success-300 dark:hover:border-success-700 hover:shadow-lg hover:shadow-success/20 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(candidate.candidate_id)}
            className="group inline-flex items-center gap-2 px-5 py-3 bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-300 border border-error-200 dark:border-error-800 hover:bg-error-100 dark:hover:bg-error-900/30 hover:border-error-300 dark:hover:border-error-700 hover:shadow-lg hover:shadow-error/20 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
          >
            <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border-subtle">
        <button
          onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
          className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-ai-50/80 via-ai-100/60 to-ai-50/80 dark:from-ai-950/30 dark:via-ai-900/20 dark:to-ai-950/30 hover:from-ai-100/90 hover:via-ai-200/70 hover:to-ai-100/90 dark:hover:from-ai-900/40 dark:hover:via-ai-800/30 dark:hover:to-ai-900/40 border border-ai-200/60 dark:border-ai-800/60 hover:border-ai-300/80 dark:hover:border-ai-700/80 transition-all duration-300 hover:shadow-md hover:shadow-ai/10"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-ai-600 to-ai-700 rounded-xl flex items-center justify-center shadow-lg shadow-ai/30">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-success-400 to-success-500 rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-text-primary group-hover:text-ai-700 transition-colors">
                AI Insights & Analysis
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">
                {isAnalysisExpanded ? 'Click to collapse' : 'Click to view detailed feedback'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-ai-600 dark:text-ai-400 bg-ai-100 dark:bg-ai-900/30 px-2 py-1 rounded-full">
              AI
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-ai-500 dark:text-ai-400 transition-all duration-300 group-hover:text-ai-600 dark:group-hover:text-ai-300',
                isAnalysisExpanded && 'rotate-180 scale-110'
              )}
            />
          </div>
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isAnalysisExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
          )}
        >
          <div
            className={cn(
              'relative p-6 bg-background-subtle rounded-2xl shadow-inner border-l-4',
              candidate.ai_score >= 70
                ? 'border-l-success-500'
                : candidate.ai_score >= 50
                  ? 'border-l-warning-500'
                  : 'border-l-error-500'
            )}
          >
            <div className="prose prose-sm max-w-none">
              <p className="text-text-secondary leading-relaxed font-medium text-[15px] mb-0">
                {candidate.ai_analysis}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Detail Modal */}
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
