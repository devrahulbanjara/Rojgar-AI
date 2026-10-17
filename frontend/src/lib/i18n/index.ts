import { neDigits } from './digits'
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

const EN_MONTHS = [
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
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Parts = {
  year: number
  month: number
  day: number
  weekday: number
  hour: number
  minute: number
}

/** Calendar parts of an instant, in `timeZone` (e.g. "Asia/Kathmandu") or the browser's zone. */
function partsOf(iso: string, timeZone?: string): Parts {
  const date = new Date(iso)
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      weekday: date.getDay(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    }
  }
  const get = (type: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .find((part) => part.type === type)?.value ?? '0'
  const year = Number(get('year'))
  const month = Number(get('month')) - 1
  const day = Number(get('day'))
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month, day)).getUTCDay(),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
  }
}

/** "8:45 PM" · "बेलुका ८:४५" */
export function formatTime(iso: string, locale: Locale, timeZone?: string): string {
  const { hour, minute } = partsOf(iso, timeZone)
  const h = String(hour % 12 || 12)
  const m = String(minute).padStart(2, '0')
  if (locale === 'ne') {
    const part = hour < 12 ? 'बिहान' : hour < 17 ? 'दिउँसो' : 'बेलुका'
    return `${part} ${neDigits(h)}:${neDigits(m)}`
  }
  return `${h}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

/** "Sun 18 Oct" · "आइत १८ अक्टोबर" */
export function formatDay(iso: string, locale: Locale, timeZone?: string): string {
  const { month, day, weekday } = partsOf(iso, timeZone)
  return locale === 'ne'
    ? `${NE_DAYS[weekday]} ${neDigits(day)} ${NE_MONTHS[month]}`
    : `${EN_DAYS[weekday]} ${day} ${EN_MONTHS[month]}`
}

/** "17 Oct" this year, else "17 Oct 2025" · "१७ अक्टोबर" */
export function formatDate(iso: string, locale: Locale, timeZone?: string): string {
  const { year, month, day } = partsOf(iso, timeZone)
  const thisYear = year === new Date().getFullYear()
  const short =
    locale === 'ne' ? `${neDigits(day)} ${NE_MONTHS[month]}` : `${day} ${EN_MONTHS[month]}`
  if (thisYear) return short
  return `${short} ${locale === 'ne' ? neDigits(year) : year}`
}

/** "Sun 18 Oct, 8:45 PM" · "आइत १८ अक्टोबर, बेलुका ८:४५" */
export function formatDateTime(iso: string, locale: Locale, timeZone?: string): string {
  return `${formatDay(iso, locale, timeZone)}, ${formatTime(iso, locale, timeZone)}`
}
