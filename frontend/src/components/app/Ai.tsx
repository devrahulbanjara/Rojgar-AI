import { useId } from 'react'

import { cn } from '@/lib/utils'

/**
 * AI moments. Use these — and only these — when AI is working or speaking:
 *   <AiGlow active={isReviewing}>…</AiGlow>   soft gradient ring that flows while busy
 *   <AiSpark active />                          two four-point stars, twinkle while busy
 *   <AiText>Reading 12 CVs…</AiText>            shimmering gradient text for live status
 * Everything else in the app stays still. Motion stops under reduced-motion.
 */

const STAR =
  'M12 0C12.9 7.1 16.9 11.1 24 12C16.9 12.9 12.9 16.9 12 24C11.1 16.9 7.1 12.9 0 12C7.1 11.1 11.1 7.1 12 0Z'

export function AiSpark({ active = false, className }: { active?: boolean; className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-4 shrink-0', className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ai-1)" />
          <stop offset="0.5" stopColor="var(--ai-2)" />
          <stop offset="1" stopColor="var(--ai-3)" />
        </linearGradient>
      </defs>
      <g className={active ? 'ai-twinkle' : undefined}>
        <path d={STAR} transform="translate(1 4) scale(0.72)" fill={`url(#${id})`} />
      </g>
      <g className={active ? 'ai-twinkle-delayed' : undefined}>
        <path d={STAR} transform="translate(15 1) scale(0.34)" fill={`url(#${id})`} />
      </g>
    </svg>
  )
}

export function AiGlow({
  active,
  className,
  children,
}: {
  active: boolean
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('rounded-2xl', active && 'ai-glow', className)}>{children}</div>
}

export function AiText({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn('ai-text font-medium', className)}>{children}</span>
}

const SPINNER_SIZES = { sm: 'size-4', md: 'size-5', lg: 'size-8' } as const

/** The only loading spinner. Gradient arc that grows and shrinks while it turns. */
export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
}: {
  size?: keyof typeof SPINNER_SIZES
  label?: string
  className?: string
}) {
  const id = useId()
  return (
    <svg
      viewBox="0 0 50 50"
      role="status"
      aria-label={label}
      className={cn('spinner shrink-0', SPINNER_SIZES[size], className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--ai-1)" />
          <stop offset="0.6" stopColor="var(--ai-2)" />
          <stop offset="1" stopColor="var(--ai-3)" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}
