// ── Shared utilities for resume components ────────────────────────────────

export const SECTIONS = ['Personal', 'Summary', 'Experience', 'Education', 'Skills'] as const

export type Section = (typeof SECTIONS)[number]

export function uid() {
  return Math.random().toString(36).slice(2)
}

export function fmtDate(val: string, fallback = 'Present') {
  if (!val) return fallback
  const [year, month] = val.split('-')
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[parseInt(month, 10) - 1]} ${year}`
}
