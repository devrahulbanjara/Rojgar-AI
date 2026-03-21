import type {
  ChatSessionResponse,
  JobEditDiff,
  SalaryResearchResult,
} from '@/lib/types/recruiterChat'

export function getInitials(name: string | null | undefined, fallback = 'RC') {
  if (!name?.trim()) return fallback

  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || fallback
  )
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function groupSessionsByDate(sessions: ChatSessionResponse[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const thisWeekStart = new Date(today.getTime() - 7 * 86400000)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const groups: Record<string, ChatSessionResponse[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    'This Month': [],
    Older: [],
  }

  for (const session of sessions) {
    const date = new Date(session.last_interaction_at ?? session.created_at)
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (day.getTime() === today.getTime()) groups.Today.push(session)
    else if (day.getTime() === yesterday.getTime()) groups.Yesterday.push(session)
    else if (date >= thisWeekStart) groups['This Week'].push(session)
    else if (date >= thisMonthStart) groups['This Month'].push(session)
    else groups.Older.push(session)
  }

  return groups
}

export function getStatusTone(status: string | null | undefined) {
  switch ((status ?? '').toLowerCase()) {
    case 'submitted':
    case 'applied':
      return 'gray'
    case 'screening':
    case 'under_review':
      return 'warning'
    case 'interview':
    case 'interview_scheduled':
    case 'shortlisted':
      return 'primary'
    case 'offered':
    case 'hired':
      return 'success'
    case 'withdrawn':
      return 'muted'
    case 'rejected':
      return 'danger'
    default:
      return 'gray'
  }
}

export function getConfidenceTone(confidence: SalaryResearchResult['confidence']) {
  if (confidence === 'high') return 'success'
  if (confidence === 'medium') return 'warning'
  return 'danger'
}

export function formatMoney(value: number | null, currency: string | null) {
  if (value == null) return 'N/A'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency || 'USD'} ${value.toLocaleString('en-US')}`
  }
}

export function formatDateLabel(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return 'Present'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-US', options ?? { month: 'short', year: 'numeric' })
}

export function formatLongDate(value: string | null | undefined) {
  return formatDateLabel(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatFieldLabel(field: string) {
  return field
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function isListDiff(diff: JobEditDiff) {
  return Array.isArray(diff.before) || Array.isArray(diff.after)
}

export function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

export function stringifyScalar(value: unknown) {
  if (value == null || value === '') return 'Empty'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString('en-US')
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
