type CompletionArrayLike = Array<unknown> | undefined | null

export type ProfileCompletionSource = {
  headline?: string | null
  summary?: string | null
  phone?: string | null
  location?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  years_of_experience?: string | number | null
  experiences?: CompletionArrayLike
  educations?: CompletionArrayLike
  skills?: CompletionArrayLike
}

export type ProfileCompletionTone = 'danger' | 'warning' | 'success'

type ProfileCompletionField = {
  key: string
  isComplete: (profile: ProfileCompletionSource) => boolean
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function hasArrayItems(value: CompletionArrayLike): boolean {
  return Array.isArray(value) && value.length > 0
}

function hasExperienceValue(value: string | number | null | undefined): boolean {
  if (typeof value === 'number') {
    return value >= 0
  }

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return false
}

export const PROFILE_COMPLETION_FIELDS: ProfileCompletionField[] = [
  { key: 'headline', isComplete: (profile) => hasText(profile.headline) },
  { key: 'summary', isComplete: (profile) => hasText(profile.summary) },
  { key: 'phone', isComplete: (profile) => hasText(profile.phone) },
  { key: 'location', isComplete: (profile) => hasText(profile.location) },
  { key: 'linkedin_url', isComplete: (profile) => hasText(profile.linkedin_url) },
  { key: 'github_url', isComplete: (profile) => hasText(profile.github_url) },
  { key: 'portfolio_url', isComplete: (profile) => hasText(profile.portfolio_url) },
  {
    key: 'years_of_experience',
    isComplete: (profile) => hasExperienceValue(profile.years_of_experience),
  },
  { key: 'experiences', isComplete: (profile) => hasArrayItems(profile.experiences) },
  { key: 'educations', isComplete: (profile) => hasArrayItems(profile.educations) },
  { key: 'skills', isComplete: (profile) => hasArrayItems(profile.skills) },
]

export const PROFILE_COMPLETION_LABEL = 'Profile Completion'

export function calculateProfileCompletionPercentage(profile: ProfileCompletionSource | null): number {
  if (!profile) return 0

  const completedFields = PROFILE_COMPLETION_FIELDS.filter((field) => field.isComplete(profile)).length

  return Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100)
}

export function getProfileCompletionMeta(score: number): {
  label: 'Incomplete' | 'Getting there' | 'Strong'
  tone: ProfileCompletionTone
} {
  if (score < 40) {
    return {
      label: 'Incomplete',
      tone: 'danger',
    }
  }

  if (score <= 70) {
    return {
      label: 'Getting there',
      tone: 'warning',
    }
  }

  return {
    label: 'Strong',
    tone: 'success',
  }
}
