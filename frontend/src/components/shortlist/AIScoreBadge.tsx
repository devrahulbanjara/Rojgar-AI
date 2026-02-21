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
      bg: 'bg-primary-50 dark:bg-primary-950/20',
      border: 'border-primary-200 dark:border-primary-800',
      text: 'text-primary-700 dark:text-primary-400',
      scoreText: 'text-primary-600 dark:text-primary-500',
    }
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      scoreText: 'text-amber-600 dark:text-amber-500',
    }
  }
  return {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-400',
    scoreText: 'text-rose-600 dark:text-rose-500',
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
    sm: { container: 'w-12 h-12', grade: 'text-sm', score: 'text-[10px]' },
    md: { container: 'w-14 h-14', grade: 'text-base', score: 'text-xs' },
    lg: { container: 'w-18 h-18', grade: 'text-lg', score: 'text-sm' },
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full border flex flex-col items-center justify-center',
          sizeClasses[size].container,
          colors.bg,
          colors.border
        )}
      >
        <span className={cn('font-bold leading-none', sizeClasses[size].grade, colors.text)}>
          {grade}
        </span>
        <span
          className={cn(
            'font-semibold leading-none mt-0.5',
            sizeClasses[size].score,
            colors.scoreText
          )}
        >
          {score}
        </span>
      </div>
      {showLabel && (
        <p className="text-[10px] text-text-tertiary font-medium tracking-tight uppercase">
          AI Score
        </p>
      )}
    </div>
  )
}
