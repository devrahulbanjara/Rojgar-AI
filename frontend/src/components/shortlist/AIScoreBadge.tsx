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
      gradient:
        'bg-gradient-to-br from-success-50 to-success-100 dark:from-success-950/30 dark:to-success-900/30',
      border: 'border-success-200 dark:border-success-800',
      text: 'text-success-700 dark:text-success-300',
      scoreText: 'text-success-600 dark:text-success-400',
    }
  }
  if (score >= 60) {
    return {
      gradient:
        'bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950/30 dark:to-warning-900/30',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-700 dark:text-warning-300',
      scoreText: 'text-warning-600 dark:text-warning-400',
    }
  }
  if (score >= 40) {
    return {
      gradient:
        'bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950/30 dark:to-warning-900/30',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-700 dark:text-warning-300',
      scoreText: 'text-warning-600 dark:text-warning-400',
    }
  }
  return {
    gradient:
      'bg-gradient-to-br from-error-50 to-error-100 dark:from-error-950/30 dark:to-error-900/30',
    border: 'border-error-200 dark:border-error-800',
    text: 'text-error-700 dark:text-error-300',
    scoreText: 'text-error-600 dark:text-error-400',
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
      {showLabel && <p className="text-xs text-text-tertiary font-medium">AI Score</p>}
    </div>
  )
}
