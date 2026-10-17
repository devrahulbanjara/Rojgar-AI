import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** A titled block on a page. Title only — no helper text under it. A null title renders just the content. */
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
      {title || action ? (
        <div className="flex items-center justify-between gap-3">
          {title ? (
            <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
          ) : null}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
