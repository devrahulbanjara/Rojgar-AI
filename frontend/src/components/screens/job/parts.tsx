import type { ReactNode } from 'react'

import { type Fit, FIT_LABEL, contactLinks } from '@/lib/api/recruiter'
import { cn } from '@/lib/utils'

import { StatusPill, type Tone } from '@/components/app/StatusPill'
import { PhoneIcon, WarningIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

const FIT_TONE: Record<Fit, Tone> = { strong: 'success', possible: 'warning', weak: 'neutral' }

/** "Fits" · "Might fit" · "Doesn't fit yet". */
export function FitPill({ fit, className }: { fit: Fit; className?: string }) {
  return (
    <StatusPill tone={FIT_TONE[fit]} className={className}>
      {FIT_LABEL[fit]}
    </StatusPill>
  )
}

/** One amber line: the CV needs a person before anyone trusts the review. */
export function FlagLine({ reason, className }: { reason: string; className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-xs text-warning', className)}>
      <WarningIcon weight="fill" className="mt-px size-3.5 shrink-0" />
      <span>Flagged: {reason.replace(/\.$/, '')}. Check the CV before deciding.</span>
    </p>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-1 hidden rounded border border-current/25 px-1 font-sans text-[10px] leading-4 opacity-70 lg:inline">
      {children}
    </kbd>
  )
}

/** Call + Viber as real tap targets. */
export function CallButtons({
  phone,
  size = 'sm',
  className,
}: {
  phone: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button asChild size={size} variant="outline">
        <a href={contactLinks.call(phone)}>
          <PhoneIcon />
          Call
        </a>
      </Button>
      <Button asChild size={size} variant="outline">
        <a href={contactLinks.viber(phone)}>Viber</a>
      </Button>
    </div>
  )
}
