import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** One line of text and at most one action. */
export function EmptyState({
  children,
  action,
  className,
}: {
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-8 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      <p>{children}</p>
      {action}
    </div>
  )
}
