'use client'

import React, { useState, useCallback } from 'react'
import { Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface GapAnalysisResult {
  match_score: number
  present_skills: string[]
  missing_skills: string[]
  message?: string
}

interface GapAnalysisProps {
  jobId: string
  resumeId: string | null
  onSelectResume?: () => void
}

export function GapAnalysis({ jobId, resumeId, onSelectResume }: GapAnalysisProps) {
  const [result, setResult] = useState<GapAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeFit = useCallback(async () => {
    if (!resumeId) {
      onSelectResume?.()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/analyze-fit?resume_id=${resumeId}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Failed to analyze. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [jobId, resumeId, onSelectResume])

  if (!result) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={analyzeFit}
        disabled={loading}
        className="gap-1.5 text-sm font-semibold"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4 text-amber-500" />
        )}
        {loading ? 'Analyzing...' : 'Analyze My Fit'}
      </Button>
    )
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  if (result.message) {
    return (
      <Card className="border-border-subtle">
        <CardContent className="p-4 text-sm text-text-tertiary">{result.message}</CardContent>
      </Card>
    )
  }

  const scoreColor =
    result.match_score >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : result.match_score >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

  return (
    <Card className="border-border-default">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-text-secondary">
            Skill Match Analysis
          </CardTitle>
          <span className={`text-2xl font-bold ${scoreColor}`}>{result.match_score}%</span>
        </div>
        {/* Score bar */}
        <div className="h-2 bg-background-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              result.match_score >= 70
                ? 'bg-emerald-500'
                : result.match_score >= 40
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${result.match_score}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Present skills */}
        {result.present_skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Skills You Have
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.present_skills.map(skill => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {result.missing_skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Skills to Learn
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.missing_skills.map(skill => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
