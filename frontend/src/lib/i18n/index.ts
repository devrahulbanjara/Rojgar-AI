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

const INTL_LOCALE: Record<Locale, string> = { en: 'en-GB', ne: 'ne-NP' }

/** "17 Oct 2026" · "१७ अक्टोबर २०२६" */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

/** "Tue 21 Oct, 2:00 pm" in the viewer's language. */
export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
