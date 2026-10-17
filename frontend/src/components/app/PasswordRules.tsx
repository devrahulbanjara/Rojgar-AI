'use client'

import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

import { CheckIcon } from '@/components/icons'

export const PASSWORD_RULES = [
  { key: 'length', test: (v: string) => v.length >= 8 },
  { key: 'cases', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: 'number', test: (v: string) => /\d/.test(v) },
] as const

export const passwordMeetsRules = (value: string) => PASSWORD_RULES.every((r) => r.test(value))

/** Compact checks shown under a new-password field while the user types. */
export function PasswordRules({ value }: { value: string }) {
  const t = useT()
  if (!value) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Password rules">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li
            key={rule.key}
            className={cn(
              'flex items-center gap-1 text-xs',
              ok ? 'text-success' : 'text-muted-foreground',
            )}
          >
            <CheckIcon className={cn('size-3.5', !ok && 'opacity-40')} aria-hidden="true" />
            {t.auth.rules[rule.key]}
          </li>
        )
      })}
    </ul>
  )
}
