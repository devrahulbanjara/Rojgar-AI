import React, { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, Brain } from 'lucide-react'
import { UserAvatar } from '../ui/UserAvatar'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'

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

  // Get score-based styling
  const getScoreStyles = (score: number) => {
    if (score < 50) {
      return {
        scoreColor: 'text-red-600',
        bgColor: 'from-red-50/80 via-red-50/40 to-red-50/60',
        borderColor: 'border-red-200/60'
      }
    } else if (score >= 50 && score < 70) {
      return {
        scoreColor: 'text-orange-600',
        bgColor: 'from-orange-50/80 via-orange-50/40 to-orange-50/60',
        borderColor: 'border-orange-200/60'
      }
    } else {
      return {
        scoreColor: 'text-emerald-600',
        bgColor: 'from-emerald-50/80 via-emerald-50/40 to-emerald-50/60',
        borderColor: 'border-emerald-200/60'
      }
    }
  }

  const scoreStyles = getScoreStyles(candidate.ai_score)

  return (
    <div
      className={cn(
        'group w-full bg-white rounded-[12px] border border-[#F1F5F9]',
        'hover:border-[#E2E8F0]',
        className
      )}
      style={{
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
        e.currentTarget.style.borderColor = '#F1F5F9'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="flex items-center gap-6">
        {/* Avatar & Name */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <UserAvatar
              name={candidate.name}
              src={candidate.picture || undefined}
              className="w-[72px] h-[72px]"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-lg font-semibold text-[#1E293B] leading-[1.2]">
              {candidate.name}
            </h3>
            {showJobTitle && (
              <div className="text-sm font-medium text-indigo-600">
                Applied for: {candidate.job_title}
              </div>
            )}
            <div className="text-sm text-slate-600">
              {candidate.email}
            </div>
          </div>
        </div>

        {/* Enhanced AI Score */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 text-center">
          <div className={`text-3xl font-bold ${scoreStyles.scoreColor} leading-none`}>
            {candidate.ai_score}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            AI Score
          </div>
          {scoreInterpretation && (
            <div className={`text-xs font-semibold ${scoreInterpretation.color}`} style={{ fontWeight: 600 }}>
              {scoreInterpretation.text}
            </div>
          )}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => onApprove(candidate.candidate_id)}
            className="group inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/20 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(candidate.candidate_id)}
            className="group inline-flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/20 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
          >
            <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Premium AI Feedback Section */}
      <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-slate-200 to-transparent">
        <button
          onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
          className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-indigo-50/80 hover:from-indigo-100/90 hover:via-purple-100/70 hover:to-indigo-100/90 border border-indigo-100/60 hover:border-indigo-200/80 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                AI Insights & Analysis
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isAnalysisExpanded ? 'Click to collapse' : 'Click to view detailed feedback'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
              AI
            </div>
            <ChevronDown 
              className={cn(
                'w-5 h-5 text-indigo-500 transition-all duration-300 group-hover:text-indigo-600',
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
          <div className={`relative p-6 bg-gray-50 rounded-2xl border-l-4 ${candidate.ai_score >= 70 ? 'border-l-emerald-500' : candidate.ai_score >= 50 ? 'border-l-orange-500' : 'border-l-red-500'} shadow-inner`}>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed font-medium text-[15px] mb-0">
                {candidate.ai_analysis}
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}