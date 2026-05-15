import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'
import { z } from 'zod'

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/
export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const LIMITS = {
  name: 100,
  title: 120,
  headline: 160,
  location: 120,
  summary: 1000,
  description: 5000,
  overview: 5000,
  signature: 2000,
  shortText: 200,
  longText: 5000,
  url: 500,
  phone: 30,
  email: 254,
  password: 128,
  skill: 50,
  listItem: 500,
  companyName: 120,
  yearsExperience: 50,
  salaryMax: 100_000_000,
  shortlistThreshold: 100,
  interviewMinutes: 480,
} as const

export const normalizeEmail = (raw: string): string => raw.trim().toLowerCase()

export const isValidEmail = (raw: string): boolean => EMAIL_REGEX.test(raw.trim())

export const isValidPhone = (raw: string, defaultCountry?: string): boolean => {
  const t = raw.trim()
  if (!t) return false
  try {
    if (defaultCountry) {
      return isValidPhoneNumber(t, defaultCountry as Parameters<typeof isValidPhoneNumber>[1])
    }
    if (t.startsWith('+')) return isValidPhoneNumber(t)
    return PHONE_REGEX.test(t)
  } catch {
    return PHONE_REGEX.test(t)
  }
}

export const formatPhone = (raw: string): string => {
  const t = raw.trim()
  if (!t) return t
  try {
    const parsed = parsePhoneNumberFromString(t)
    return parsed ? parsed.formatInternational() : t
  } catch {
    return t
  }
}

export const isValidUrl = (raw: string): boolean => {
  const t = raw.trim()
  if (!t) return false
  return URL_REGEX.test(t)
}

export const isValidPassword = (raw: string): boolean => PASSWORD_REGEX.test(raw)

export const startOfTodayISO = (): string => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export const todayMonthInput = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const nowDatetimeLocalInput = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const isFutureDate = (iso: string): boolean => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  return t > Date.now()
}

export const isTodayOrFuture = (iso: string): boolean => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return t >= start.getTime()
}

export const isPastOrToday = (iso: string): boolean => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return t <= end.getTime()
}

export const isDateOrderValid = (start: string, end: string): boolean => {
  if (!start || !end) return true
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (Number.isNaN(s) || Number.isNaN(e)) return true
  return e >= s
}

export const isSalaryRangeValid = (
  min: number | string | null | undefined,
  max: number | string | null | undefined,
): boolean => {
  const mn = min == null || min === '' ? null : Number(min)
  const mx = max == null || max === '' ? null : Number(max)
  if (mn == null || mx == null) return true
  if (Number.isNaN(mn) || Number.isNaN(mx)) return true
  return mn <= mx
}

export const isNonNegativeNumber = (v: number | string | null | undefined): boolean => {
  if (v == null || v === '') return true
  const n = Number(v)
  return !Number.isNaN(n) && n >= 0
}

export const clampNumber = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v))

export const hasDuplicate = (
  items: readonly string[],
  candidate: string,
  caseInsensitive = true,
): boolean => {
  const c = candidate.trim()
  if (!c) return false
  return items.some((it) =>
    caseInsensitive ? it.trim().toLowerCase() === c.toLowerCase() : it.trim() === c,
  )
}

export const dedupeStrings = (items: readonly string[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const it of items) {
    const key = it.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(it.trim())
  }
  return out
}

export const trimWithin = (raw: string, max: number): string =>
  raw.length > max ? raw.slice(0, max) : raw

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>

export const firstZodError = (
  result: { success: true } | { success: false; error: z.ZodError },
): FieldErrors => {
  if (result.success) return {}
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_'
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(LIMITS.email, `Email too long (max ${LIMITS.email})`)
  .regex(EMAIL_REGEX, 'Enter a valid email')
  .transform((v) => v.toLowerCase())

export const phoneSchema = z
  .string()
  .trim()
  .max(LIMITS.phone, `Phone too long (max ${LIMITS.phone})`)
  .refine(isValidPhone, 'Enter a valid phone number (include country code, e.g. +1 555 123 4567)')

export const optionalPhoneSchema = z.union([z.literal(''), phoneSchema]).optional()

export const urlSchema = z
  .string()
  .trim()
  .max(LIMITS.url, `URL too long (max ${LIMITS.url})`)
  .regex(URL_REGEX, 'URL must start with http:// or https://')

export const optionalUrlSchema = z.union([z.literal(''), urlSchema]).optional()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(LIMITS.password, `Password too long (max ${LIMITS.password})`)
  .regex(PASSWORD_REGEX, 'Password must include uppercase, lowercase, and a number')

export const nonEmptyText = (max: number, label = 'This field') =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} too long (max ${max})`)

export const optionalText = (max: number, label = 'This field') =>
  z.string().trim().max(max, `${label} too long (max ${max})`).optional().or(z.literal(''))

export const salaryRangeRefine = <
  T extends {
    salary_min?: number | string | null
    salary_max?: number | string | null
  },
>(
  schema: z.ZodType<T>,
) =>
  schema.refine((v) => isSalaryRangeValid(v.salary_min, v.salary_max), {
    message: 'Maximum salary must be greater than or equal to minimum',
    path: ['salary_max'],
  })

export const dateRangeRefine = <T extends { startDate?: string | null; endDate?: string | null }>(
  schema: z.ZodType<T>,
) =>
  schema.refine((v) => isDateOrderValid(v.startDate ?? '', v.endDate ?? ''), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const passwordChangeSchema = z
  .object({
    current_password: z.string().optional().or(z.literal('')),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export const FILE_LIMITS = {
  resumeBytes: 10 * 1024 * 1024,
  resumeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  resumeExt: ['.pdf', '.doc', '.docx'],
} as const

export const validateResumeFile = (file: File): { ok: true } | { ok: false; error: string } => {
  if (file.size > FILE_LIMITS.resumeBytes) {
    return {
      ok: false,
      error: `File too large (max ${FILE_LIMITS.resumeBytes / (1024 * 1024)}MB)`,
    }
  }
  const name = file.name.toLowerCase()
  const okExt = FILE_LIMITS.resumeExt.some((e) => name.endsWith(e))
  const okType = !file.type || (FILE_LIMITS.resumeTypes as readonly string[]).includes(file.type)
  if (!okExt || !okType) {
    return {
      ok: false,
      error: 'Unsupported file type. Use PDF, DOC, or DOCX.',
    }
  }
  return { ok: true }
}
