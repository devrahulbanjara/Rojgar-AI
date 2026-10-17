import { cn } from '@/lib/utils'

import { CheckIcon } from '@/components/icons'

export const PASSWORD_RULES = [
  { label: '8+ characters', test: (v: string) => v.length >= 8 },
  { label: 'Upper and lower case', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'A number', test: (v: string) => /\d/.test(v) },
]

export const passwordMeetsRules = (value: string) => PASSWORD_RULES.every((r) => r.test(value))

/** Compact checks shown under a new-password field while the user types. */
export function PasswordRules({ value }: { value: string }) {
  if (!value) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Password rules">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-1 text-xs',
              ok ? 'text-success' : 'text-muted-foreground',
            )}
          >
            <CheckIcon className={cn('size-3.5', !ok && 'opacity-40')} aria-hidden="true" />
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
