import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Legal words that say nothing about who it is ("F1Soft International Pvt. Ltd." → "FI").
const LEGAL_WORDS = new Set([
  'pvt',
  'private',
  'ltd',
  'limited',
  'inc',
  'llc',
  'llp',
  'plc',
  'co',
  'corp',
  'company',
  'प्रा',
  'लि',
])

/** One or two initials from a person's or business's name. */
export function initials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((part) => part && !LEGAL_WORDS.has(part.toLowerCase()))
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** Person (round) or company (rounded square) avatar with initials fallback. */
export function EntityAvatar({
  name,
  src,
  kind = 'person',
  className,
}: {
  name: string
  src?: string | null
  kind?: 'person' | 'company'
  className?: string
}) {
  const shape = kind === 'company' ? 'rounded-lg' : 'rounded-full'
  return (
    <Avatar className={cn('size-9', shape, className)}>
      {src ? <AvatarImage src={src} alt="" className={shape} /> : null}
      <AvatarFallback
        className={cn('bg-accent text-xs font-semibold text-accent-foreground', shape)}
      >
        {initials(name) || '?'}
      </AvatarFallback>
    </Avatar>
  )
}
