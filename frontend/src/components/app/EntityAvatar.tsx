import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function initials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase()
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
