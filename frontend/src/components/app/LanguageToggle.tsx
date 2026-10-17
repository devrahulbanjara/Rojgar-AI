'use client'

import { type Locale, isLocale } from '@/lib/i18n'
import { useLocale, useSetLocale, useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const LABELS: Record<Locale, string> = { en: 'EN', ne: 'नेपाली' }

/** EN | नेपाली. The choice is kept in a cookie for a year. */
export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useT()
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={locale}
      aria-label={t.nav.language}
      onValueChange={(value) => isLocale(value) && value !== locale && setLocale(value)}
      className={cn(
        'overflow-hidden rounded-full border border-border bg-card shadow-xs',
        className,
      )}
    >
      {(Object.keys(LABELS) as Locale[]).map((key) => (
        <ToggleGroupItem
          key={key}
          value={key}
          lang={key}
          className="h-8 rounded-none px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary"
        >
          {LABELS[key]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
