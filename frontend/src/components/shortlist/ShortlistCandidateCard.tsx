import React, { useState } from 'react'
import { CheckCircle2, XCircle, Sparkles, ChevronDown } from 'lucide-react'
import { UserAvatar } from '../ui/UserAvatar'
import { cn } from '../../lib/utils'
import type { ShortlistCandidate } from '../../types/shortlist'

interface ShortlistCandidateCardProps {
  candidate: ShortlistCandidate
  onApprove: (candidateId: string) => void
  onReject: (candidateId: string) => void
  className?: string
}

export function ShortlistCandidateCard({
  candidate,
  onApprove,
  onReject,
  className,
}: ShortlistCandidateCardProps) {
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false)

  return (
    <div
      className={cn(
        'group w-full bg-white rounded-[12px] border border-[#F1F5F9]',
        'hover:border-[#E2E8F0]',
        className
      )}
      style={{
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.borderColor = '#E2E8F0'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'
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

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#1E293B] leading-[1.2]">
              {candidate.name}
            </h3>
          </div>
        </div>

        {/* AI Score - Just the number */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="text-2xl font-bold text-indigo-600">
            {candidate.ai_score}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            AI Score
          </div>
        </div>

        {/* Action Buttons - Consistent with website theme */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <button
            onClick={() => onApprove(candidate.candidate_id)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(candidate.candidate_id)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95"
          >
            <XCircle className="w-4 h-4" />
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
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" />
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
            'overflow-hidden transition-all duration-500 ease-out',
            isAnalysisExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          )}
        >
          <div className="relative p-6 bg-gradient-to-br from-slate-50/80 via-indigo-50/40 to-purple-50/60 rounded-2xl border border-slate-200/60 shadow-inner">
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-indigo-100/60 to-purple-100/60 rounded-full blur-xl" />
            <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-amber-100/60 to-orange-100/60 rounded-full blur-lg" />
            
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 leading-relaxed font-medium text-[15px] mb-0">
                      {candidate.ai_analysis}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Premium footer */}
              <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>AI Analysis Complete</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Score: {candidate.ai_score}/100
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}