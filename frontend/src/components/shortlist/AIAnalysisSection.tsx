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
        const cleanSentence = sentence.trim().replace(/^(strong|excellent|outstanding|impressive|proven|good)\s*/i, '')
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
        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Analysis</span>
        <ChevronDown 
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )} 
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-smooth',
          isExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
      >
        <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 rounded-lg p-5 border border-indigo-100">
          {/* Purple Sparkles Badge */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-purple-600" />
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
                          className="bg-emerald-50/80 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full"
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
                          className="bg-amber-50/80 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full"
                          style={{ animationDelay: `${(strengths.length + index) * 100}ms` }}
                        >
                          {concern}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Analysis */}
              <div className="text-sm text-[#475569] leading-relaxed space-y-3">
                {analysis.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Applied Timestamp */}
              {appliedAt && (
                <div className="pt-3 border-t border-indigo-100/50">
                  <span className="bg-purple-50/80 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
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
