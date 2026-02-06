/**
 * ConvexHire Design System - AI Score Colors
 *
 * Score-to-color mapping for AI match scores.
 * Colors communicate the quality of candidate-job match.
 *
 * 90-100: Excellent (Emerald) - Top tier candidates
 * 80-89: Great (Teal) - Strong matches
 * 70-79: Good (Blue) - Solid candidates
 * 60-69: Moderate (Amber) - Needs attention
 * 40-59: Weak (Orange) - Significant gaps
 * 0-39: Poor (Red) - Not recommended
 */

export type ScoreCategory = 'excellent' | 'great' | 'good' | 'moderate' | 'weak' | 'poor'

export interface AIScoreColorConfig {
  light: {
    bg: string
    text: string
    border: string
    ring: string
  }
  dark: {
    bg: string
    text: string
    border: string
  }
  hex: {
    bg: string
    text: string
    border: string
  }
  label: string
  icon: string
}

export const AI_SCORE_COLORS: Record<ScoreCategory, AIScoreColorConfig> = {
  excellent: {
    // 90-100
    light: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      ring: 'ring-emerald-500/20',
    },
    dark: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-300',
      border: 'border-emerald-800',
    },
    hex: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
    label: 'Excellent Match',
    icon: '🌟',
  },
  great: {
    // 80-89
    light: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      ring: 'ring-teal-500/20',
    },
    dark: {
      bg: 'bg-teal-950/50',
      text: 'text-teal-300',
      border: 'border-teal-800',
    },
    hex: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
    label: 'Great Match',
    icon: '⭐',
  },
  good: {
    // 70-79
    light: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      ring: 'ring-blue-500/20',
    },
    dark: {
      bg: 'bg-blue-950/50',
      text: 'text-blue-300',
      border: 'border-blue-800',
    },
    hex: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    label: 'Good Match',
    icon: '👍',
  },
  moderate: {
    // 60-69
    light: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      ring: 'ring-amber-500/20',
    },
    dark: {
      bg: 'bg-amber-950/50',
      text: 'text-amber-300',
      border: 'border-amber-800',
    },
    hex: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    label: 'Moderate Match',
    icon: '⚠️',
  },
  weak: {
    // 40-59
    light: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      ring: 'ring-orange-500/20',
    },
    dark: {
      bg: 'bg-orange-950/50',
      text: 'text-orange-300',
      border: 'border-orange-800',
    },
    hex: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
    label: 'Weak Match',
    icon: '📊',
  },
  poor: {
    // 0-39
    light: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      ring: 'ring-red-500/20',
    },
    dark: {
      bg: 'bg-red-950/50',
      text: 'text-red-300',
      border: 'border-red-800',
    },
    hex: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
    label: 'Poor Match',
    icon: '❌',
  },
} as const

/**
 * Get the score category based on numeric score
 */
export function getScoreCategory(score: number): ScoreCategory {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'great'
  if (score >= 70) return 'good'
  if (score >= 60) return 'moderate'
  if (score >= 40) return 'weak'
  return 'poor'
}

/**
 * Get color config for a numeric score
 */
export function getScoreColor(score: number): AIScoreColorConfig {
  return AI_SCORE_COLORS[getScoreCategory(score)]
}

/**
 * Get Tailwind classes for AI score badge
 */
export function getScoreBadgeClasses(score: number): string {
  const colors = getScoreColor(score)
  return `${colors.light.bg} ${colors.light.text} ${colors.light.border} ${colors.light.ring} dark:${colors.dark.bg} dark:${colors.dark.text} dark:${colors.dark.border}`
}

/**
 * Get human-readable label for score
 */
export function getScoreLabel(score: number): string {
  return getScoreColor(score).label
}

/**
 * Get icon for score
 */
export function getScoreIcon(score: number): string {
  return getScoreColor(score).icon
}

/**
 * Get hex colors for score (useful for charts/canvas)
 */
export function getScoreHexColors(score: number): {
  bg: string
  text: string
  border: string
} {
  return getScoreColor(score).hex
}

export default AI_SCORE_COLORS
