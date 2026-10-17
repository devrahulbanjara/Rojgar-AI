import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** A titled block on a page. Title only — no helper text under it. */
export function Section({
  title,
  action,
  children,
  className,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
