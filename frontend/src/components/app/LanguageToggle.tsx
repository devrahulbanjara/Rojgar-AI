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
      variant="outline"
      value={locale}
      aria-label={t.nav.language}
      onValueChange={(value) => isLocale(value) && value !== locale && setLocale(value)}
      className={cn('rounded-full bg-card', className)}
    >
      {(Object.keys(LABELS) as Locale[]).map((key) => (
        <ToggleGroupItem
          key={key}
          value={key}
          lang={key}
          className="px-3 text-xs first:rounded-l-full last:rounded-r-full data-[state=on]:bg-foreground data-[state=on]:text-background"
        >
          {LABELS[key]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
