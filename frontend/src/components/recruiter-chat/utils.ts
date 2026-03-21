import type {
  RecruiterChatCandidateDetailPayload,
  RecruiterChatCandidateSearchPayload,
  RecruiterChatSalaryPayload,
  RecruiterChatToolEnvelope,
} from '@/store/services/recruiterChatApi'

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'C'
}

export function formatMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (value == null) return 'N/A'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency || 'USD'} ${Number(value).toLocaleString()}`
  }
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Unknown'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return 'Present'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function getStatusTone(status: string | null | undefined) {
  switch (status) {
    case 'shortlisted':
    case 'hired':
      return 'success'
    case 'interview_scheduled':
    case 'under_review':
      return 'primary'
    case 'rejected':
      return 'danger'
    default:
      return 'gray'
  }
}

export function getConfidenceTone(confidence: string | null | undefined) {
  switch (confidence) {
    case 'high':
      return 'success'
    case 'medium':
      return 'warning'
    default:
      return 'danger'
  }
}

export function getSkillNames(
  skills: RecruiterChatCandidateDetailPayload['skills'] | string[] | undefined,
) {
  if (!Array.isArray(skills)) return []
  return skills
    .map((skill) => (typeof skill === 'string' ? skill : skill.skill_name))
    .filter(Boolean)
}

export function unwrapToolEnvelope<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null

  const envelope = value as RecruiterChatToolEnvelope
  if ('data' in envelope) {
    return (envelope.data as T | null | undefined) ?? null
  }

  return value as T
}

export function normalizeCandidateSearch(value: unknown): RecruiterChatCandidateSearchPayload | null {
  const payload = unwrapToolEnvelope<RecruiterChatCandidateSearchPayload>(value)
  if (!payload || !Array.isArray(payload.candidates)) return null
  return payload
}

export function normalizeSalaryPayload(value: unknown): RecruiterChatSalaryPayload | null {
  const payload = unwrapToolEnvelope<Record<string, unknown>>(value)
  if (!payload) return null

  return {
    role: String(payload.role ?? 'Unknown role'),
    country: String(payload.country ?? 'Unknown country'),
    currency: (payload.currency as string | null | undefined) ?? null,
    min: (payload.min as number | null | undefined) ?? (payload.recommended_min as number | null | undefined),
    max: (payload.max as number | null | undefined) ?? (payload.recommended_max as number | null | undefined),
    median: (payload.median as number | null | undefined) ?? null,
    recommended_min: (payload.recommended_min as number | null | undefined) ?? null,
    recommended_max: (payload.recommended_max as number | null | undefined) ?? null,
    confidence: (payload.confidence as RecruiterChatSalaryPayload['confidence']) ?? 'low',
    year_context: (payload.year_context as string | undefined) ?? '',
    rationale: (payload.rationale as string | undefined) ?? '',
    sources: Array.isArray(payload.sources)
      ? payload.sources
          .map((source) => {
            if (!source || typeof source !== 'object') return null
            const item = source as Record<string, unknown>
            return {
              title: (item.title as string | undefined) ?? undefined,
              source_name: (item.source_name as string | undefined) ?? undefined,
              url: String(item.url ?? ''),
            }
          })
          .filter((source): source is NonNullable<typeof source> => Boolean(source?.url))
      : [],
  }
}

export function normalizeCandidateDetail(
  value: unknown,
): RecruiterChatCandidateDetailPayload | null {
  const payload = unwrapToolEnvelope<RecruiterChatCandidateDetailPayload>(value)
  if (!payload || !payload.full_name || !payload.resume_name) return null
  return payload
}
