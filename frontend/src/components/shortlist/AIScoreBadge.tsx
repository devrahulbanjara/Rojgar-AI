import React from 'react'
import { cn } from '../../lib/utils'

interface AIScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const getScoreGrade = (score: number): string => {
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'A-'
  if (score >= 75) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 55) return 'C'
  if (score >= 50) return 'C-'
  return 'D'
}

const getScoreColors = (score: number) => {
  if (score >= 80) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      scoreText: 'text-emerald-600',
    }
  }
  if (score >= 60) {
    return {
      gradient: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-700',
      scoreText: 'text-amber-600',
    }
  }
  if (score >= 40) {
    return {
      gradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-700',
      scoreText: 'text-orange-600',
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-red-50 to-red-100',
    border: 'border-red-200',
    text: 'text-red-700',
    scoreText: 'text-red-600',
  }
}

export function AIScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  className,
}: AIScoreBadgeProps) {
  const grade = getScoreGrade(score)
  const colors = getScoreColors(score)
  const sizeClasses = {
    sm: { container: 'w-12 h-12', grade: 'text-sm', score: 'text-xs' },
    md: { container: 'w-16 h-16', grade: 'text-lg', score: 'text-xs' },
    lg: { container: 'w-20 h-20', grade: 'text-xl', score: 'text-sm' },
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full border-2 flex flex-col items-center justify-center',
          sizeClasses[size].container,
          colors.gradient,
          colors.border
        )}
      >
        <span className={cn('font-bold', sizeClasses[size].grade, colors.text)}>{grade}</span>
        <span className={cn('font-semibold', sizeClasses[size].score, colors.scoreText)}>
          {score}
        </span>
      </div>
      {showLabel && <p className="text-xs text-slate-500 font-medium">AI Score</p>}
    </div>
  )
}
