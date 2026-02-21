import React, { useState } from 'react'
import { ChevronDown, Brain, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AIAnalysisSectionProps {
  analysis: string
  appliedAt?: string
  className?: string
}

export function AIAnalysisSection({ analysis, appliedAt, className }: AIAnalysisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const extractTags = (text: string) => {
    const strengths: string[] = []
    const concerns: string[] = []

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
        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm flex items-center gap-2 transition-colors"
      >
        <Brain className="w-4 h-4" />
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
        <div className="bg-background-subtle dark:bg-background-muted rounded-xl p-5 border border-border-default space-y-4">
          {/* Tags */}
          {(strengths.length > 0 || concerns.length > 0) && (
            <div className="space-y-2.5">
              {strengths.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {strengths.map((strength, index) => (
                    <span
                      key={index}
                      className="bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50 text-[11px] font-medium px-2.5 py-1 rounded-lg"
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
                      className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 text-[11px] font-medium px-2.5 py-1 rounded-lg"
                    >
                      {concern}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis text */}
          <div className="text-sm text-text-secondary leading-relaxed space-y-3">
            {analysis.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Applied date */}
          {appliedAt && (
            <div className="pt-3 border-t border-border-subtle">
              <span className="text-text-tertiary px-1 text-[11px] font-medium inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Applied {appliedAt}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
