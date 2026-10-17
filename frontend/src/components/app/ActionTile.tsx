import Link from 'next/link'

import { cn } from '@/lib/utils'

type TileTone = 'primary' | 'warning' | 'muted'

const TONES: Record<TileTone, string> = {
  primary: 'bg-primary/8 text-primary hover:bg-primary/12',
  warning: 'bg-warning-bg text-warning hover:bg-warning-bg/70',
  muted: 'bg-muted text-muted-foreground hover:bg-accent',
}

/**
 * A count that is also the way in: "+12 to review". Zero renders muted and
 * still links, so a role card's layout never jumps.
 */
export function ActionTile({
  count,
  label,
  href,
  tone = 'primary',
}: {
  count: number
  label: string
  href: string
  tone?: TileTone
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1 rounded-lg px-3 py-2.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        TONES[count === 0 ? 'muted' : tone],
      )}
    >
      <span className="font-heading text-2xl leading-none font-light tabular-nums">
        {count > 0 ? `+${count}` : 0}
      </span>
      <span className="truncate text-xs font-medium">{label}</span>
    </Link>
  )
}
