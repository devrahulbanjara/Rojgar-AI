export type JobLevel =
  | 'Entry Level'
  | 'Junior'
  | 'Mid-Level'
  | 'Senior'
  | 'Lead'
  | 'Principal'
  | 'Executive'

export interface JobLevelColorConfig {
  light: {
    bg: string
    text: string
    border: string
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
  icon: string
}

export const JOB_LEVEL_COLORS: Record<JobLevel, JobLevelColorConfig> = {
  'Entry Level': {
    light: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    dark: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-300',
      border: 'border-emerald-800',
    },
    hex: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
    icon: '🌱',
  },
  Junior: {
    light: {
      bg: 'bg-teal-50/80',
      text: 'text-teal-700',
      border: 'border-teal-200',
    },
    dark: {
      bg: 'bg-teal-950/50',
      text: 'text-teal-300',
      border: 'border-teal-800',
    },
    hex: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
    icon: '🚀',
  },
  'Mid-Level': {
    light: {
      bg: 'bg-blue-50/80',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    dark: {
      bg: 'bg-blue-950/50',
      text: 'text-blue-300',
      border: 'border-blue-800',
    },
    hex: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    icon: '💼',
  },
  Senior: {
    light: {
      bg: 'bg-indigo-50/80',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    dark: {
      bg: 'bg-indigo-950/50',
      text: 'text-indigo-300',
      border: 'border-indigo-800',
    },
    hex: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
    icon: '⭐',
  },
  Lead: {
    light: {
      bg: 'bg-violet-50/80',
      text: 'text-violet-700',
      border: 'border-violet-200',
    },
    dark: {
      bg: 'bg-violet-950/50',
      text: 'text-violet-300',
      border: 'border-violet-800',
    },
    hex: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
    icon: '🎯',
  },
  Principal: {
    light: {
      bg: 'bg-purple-50/80',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    dark: {
      bg: 'bg-purple-950/50',
      text: 'text-purple-300',
      border: 'border-purple-800',
    },
    hex: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
    icon: '👑',
  },
  Executive: {
    light: {
      bg: 'bg-fuchsia-50/80',
      text: 'text-fuchsia-700',
      border: 'border-fuchsia-200',
    },
    dark: {
      bg: 'bg-fuchsia-950/50',
      text: 'text-fuchsia-300',
      border: 'border-fuchsia-800',
    },
    hex: { bg: '#FDF4FF', text: '#A21CAF', border: '#F5D0FE' },
    icon: '🏆',
  },
} as const

export function getJobLevelColor(level: string): JobLevelColorConfig {
  const normalizedLevel = level.trim() as JobLevel
  return JOB_LEVEL_COLORS[normalizedLevel] ?? JOB_LEVEL_COLORS['Mid-Level']
}

export function getJobLevelBadgeClasses(level: string): string {
  const colors = getJobLevelColor(level)
  return `${colors.light.bg} ${colors.light.text} ${colors.light.border} dark:${colors.dark.bg} dark:${colors.dark.text} dark:${colors.dark.border}`
}

export function getJobLevelIcon(level: string): string {
  return getJobLevelColor(level).icon
}

export function getJobLevelHexColors(level: string): {
  bg: string
  text: string
  border: string
} {
  return getJobLevelColor(level).hex
}

export default JOB_LEVEL_COLORS
