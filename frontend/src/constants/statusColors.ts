export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interviewing'
  | 'shortlisted'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn'

export interface StatusColorConfig {
  light: {
    bg: string
    text: string
    border: string
    icon: string
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
}

export const STATUS_COLORS: Record<ApplicationStatus, StatusColorConfig> = {
  applied: {
    light: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: '📩',
    },
    dark: {
      bg: 'bg-sky-950/50',
      text: 'text-sky-300',
      border: 'border-sky-800',
    },
    hex: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
    label: 'Applied',
  },
  screening: {
    light: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: '🔍',
    },
    dark: {
      bg: 'bg-blue-950/50',
      text: 'text-blue-300',
      border: 'border-blue-800',
    },
    hex: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    label: 'AI Screening',
  },
  interviewing: {
    light: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: '💬',
    },
    dark: {
      bg: 'bg-amber-950/50',
      text: 'text-amber-300',
      border: 'border-amber-800',
    },
    hex: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    label: 'Interviewing',
  },
  shortlisted: {
    light: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      icon: '✨',
    },
    dark: {
      bg: 'bg-teal-950/50',
      text: 'text-teal-300',
      border: 'border-teal-800',
    },
    hex: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
    label: 'Shortlisted',
  },
  offered: {
    light: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: '📄',
    },
    dark: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-300',
      border: 'border-emerald-800',
    },
    hex: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
    label: 'Offer Extended',
  },
  hired: {
    light: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: '✅',
    },
    dark: {
      bg: 'bg-green-950/50',
      text: 'text-green-300',
      border: 'border-green-800',
    },
    hex: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    label: 'Hired',
  },
  rejected: {
    light: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: '✖',
    },
    dark: {
      bg: 'bg-red-950/50',
      text: 'text-red-300',
      border: 'border-red-800',
    },
    hex: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
    label: 'Not Selected',
  },
  withdrawn: {
    light: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: '↩',
    },
    dark: {
      bg: 'bg-gray-950/50',
      text: 'text-gray-300',
      border: 'border-gray-800',
    },
    hex: { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
    label: 'Withdrawn',
  },
} as const

export function getStatusColor(status: string): StatusColorConfig {
  const normalizedStatus = status.toLowerCase() as ApplicationStatus
  return STATUS_COLORS[normalizedStatus] ?? STATUS_COLORS.applied
}

export function getStatusBadgeClasses(status: string): string {
  const colors = getStatusColor(status)
  return `${colors.light.bg} ${colors.light.text} ${colors.light.border} dark:${colors.dark.bg} dark:${colors.dark.text} dark:${colors.dark.border}`
}

export function getStatusLabel(status: string): string {
  return getStatusColor(status).label
}

export function getStatusIcon(status: string): string {
  return getStatusColor(status).light.icon
}

export default STATUS_COLORS
