import { type Dict, en } from './en'
import { ne } from './ne'

export type { Dict }
export const LOCALES = ['en', 'ne'] as const
export type Locale = (typeof LOCALES)[number]
export const LOCALE_COOKIE = 'lang'
export const DICTS: Record<Locale, Dict> = { en, ne }

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** The saved choice, else Nepali when the browser prefers it over English, else English. */
export function pickLocale(saved?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(saved)) return saved
  const preferred = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1 }
    })
    .filter(({ tag }) => tag.startsWith('ne') || tag.startsWith('en'))
    .sort((a, b) => b.q - a.q)[0]
  return preferred?.tag.startsWith('ne') ? 'ne' : 'en'
}

// Browsers often ship without Nepali date data (Intl falls back to US English),
// so Nepali dates are built here: Devanagari digits, Nepali month names.
const NE_DIGITS = '०१२३४५६७८९'
const NE_MONTHS = [
  'जनवरी',
  'फेब्रुअरी',
  'मार्च',
  'अप्रिल',
  'मे',
  'जुन',
  'जुलाई',
  'अगस्ट',
  'सेप्टेम्बर',
  'अक्टोबर',
  'नोभेम्बर',
  'डिसेम्बर',
]
const NE_DAYS = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि']
const neDigits = (n: number | string) => String(n).replace(/\d/g, (d) => NE_DIGITS[Number(d)])

function neTime(date: Date): string {
  const h = date.getHours()
  const part = h < 12 ? 'बिहान' : h < 17 ? 'दिउँसो' : 'बेलुका'
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${part} ${neDigits(h % 12 || 12)}:${neDigits(minutes)}`
}

/** "17 Oct 2026" · "१७ अक्टोबर २०२६" */
export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (locale === 'ne') {
    return `${neDigits(date.getDate())} ${NE_MONTHS[date.getMonth()]} ${neDigits(date.getFullYear())}`
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** "Sun 18 Oct, 11:00" · "आइत १८ अक्टोबर, बिहान ११:००" */
export function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (locale === 'ne') {
    return `${NE_DAYS[date.getDay()]} ${neDigits(date.getDate())} ${NE_MONTHS[date.getMonth()]}, ${neTime(date)}`
  }
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
