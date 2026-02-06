import React, { useState } from 'react'
import { ChevronDown, Sparkles, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AIAnalysisSectionProps {
  analysis: string
  appliedAt?: string
  className?: string
}

export function AIAnalysisSection({ analysis, appliedAt, className }: AIAnalysisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract strengths and concerns from analysis
  const extractTags = (text: string) => {
    const strengths: string[] = []
    const concerns: string[] = []

    // Simple keyword-based extraction (can be enhanced with NLP)
    const strengthKeywords = ['strong', 'excellent', 'outstanding', 'impressive', 'proven', 'good']
    const concernKeywords = ['lacks', 'limited', 'gap', 'minor', 'consideration', 'may need']

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase()
      if (strengthKeywords.some(keyword => lowerSentence.includes(keyword))) {
        const cleanSentence = sentence
          .trim()
          .replace(/^(strong|excellent|outstanding|impressive|proven|good)\s*/i, '')
        if (cleanSentence.length > 5 && strengths.length < 3) {
          strengths.push(cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1))
        }
      }
      if (concernKeywords.some(keyword => lowerSentence.includes(keyword))) {
        const cleanSentence = sentence.trim()
        if (cleanSentence.length > 5 && concerns.length < 2) {
          concerns.push(cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1))
        }
      }
    })

    return { strengths, concerns }
  }

  const { strengths, concerns } = extractTags(analysis)

  return (
    <div className={className}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-ai-600 dark:text-ai-400 hover:text-ai-700 dark:hover:text-ai-300 font-medium text-sm flex items-center gap-2 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Analysis</span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-smooth',
          isExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
      >
        <div className="bg-gradient-to-br from-ai-50/30 to-ai-100/30 dark:from-ai-950/30 dark:to-ai-900/30 rounded-lg p-5 border border-ai-200 dark:border-ai-800">
          {/* Purple Sparkles Badge */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-6 h-6 bg-ai-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-ai-600" />
            </div>
            <div className="flex-1 space-y-3">
              {/* Tags */}
              {(strengths.length > 0 || concerns.length > 0) && (
                <div className="space-y-2">
                  {strengths.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="bg-success-50/80 dark:bg-success-950/30 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800 text-xs px-2.5 py-1 rounded-full"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  )}
                  {concerns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {concerns.map((concern, index) => (
                        <span
                          key={index}
                          className="bg-warning-50/80 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-800 text-xs px-2.5 py-1 rounded-full"
                          style={{ animationDelay: `${(strengths.length + index) * 100}ms` }}
                        >
                          {concern}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Analysis - AI Reasoning in Monospace */}
              <div className="text-sm text-text-secondary leading-relaxed space-y-3 font-mono">
                {analysis.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Applied Timestamp */}
              {appliedAt && (
                <div className="pt-3 border-t border-ai-200/50 dark:border-ai-800/50">
                  <span className="bg-ai-50/80 dark:bg-ai-950/30 text-ai-700 dark:text-ai-300 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Applied {appliedAt}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
