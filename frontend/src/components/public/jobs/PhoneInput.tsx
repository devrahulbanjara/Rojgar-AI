'use client'

import { cn } from '@/lib/utils'

import { Input } from '@/components/ui/input'

const NP_MOBILE = /^9[678]\d{8}$/

/**
 * E.164 for a Nepali mobile (98XXXXXXXX, with or without +977) or a
 * +<country code> number; null otherwise. Same rule as the backend.
 */
export function toE164(raw: string): string | null {
  let value = raw.trim().replace(/[\s().-]/g, '')
  if (value.startsWith('00')) value = `+${value.slice(2)}`
  if (value.startsWith('+')) {
    const rest = value.slice(1)
    if (!/^\d+$/.test(rest)) return null
    if (rest.startsWith('977')) return NP_MOBILE.test(rest.slice(3)) ? `+${rest}` : null
    return rest.length >= 8 && rest.length <= 15 ? `+${rest}` : null
  }
  if (value.startsWith('977') && value.length === 13) value = value.slice(3)
  return NP_MOBILE.test(value) ? `+977${value}` : null
}

/** Mobile number with a fixed +977 prefix; people can still type another +country code. */
export function PhoneInput({
  id,
  value,
  onChange,
  invalid,
  autoComplete = 'tel-national',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  autoComplete?: string
}) {
  const foreign = value.trim().startsWith('+')
  return (
    <div className="relative">
      {foreign ? null : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted-foreground"
        >
          +977
        </span>
      )}
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder="98XXXXXXXX"
        className={cn('h-12 text-base', !foreign && 'pl-14')}
        value={value}
        maxLength={20}
        aria-invalid={invalid}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
