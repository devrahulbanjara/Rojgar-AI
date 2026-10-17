import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Logo } from './Logo'

/** Full-page state (404, crash, waiting for approval): logo mark, one line, one action. */
export function SystemState({
  children,
  action,
  fullScreen = false,
}: {
  children: ReactNode
  action?: ReactNode
  /** Fill the viewport (no site header around it). */
  fullScreen?: boolean
}) {
  return (
    <div
      role="status"
      className={cn(
        'app-surface flex flex-col items-center justify-center gap-6 bg-background px-4 text-center',
        fullScreen ? 'min-h-dvh' : 'min-h-[70dvh]',
      )}
    >
      <Logo variant="mark" className="size-12" />
      <p className="max-w-sm font-heading text-xl text-foreground">{children}</p>
      {action}
    </div>
  )
}
