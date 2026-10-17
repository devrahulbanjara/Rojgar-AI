import type { ReactNode } from 'react'

import { BrandMark } from '@/components/app/PublicNav'

/** The one auth layout: wordmark, a narrow card with a one-line title, and optional footers. */
export function AuthCard({
  title,
  children,
  footer,
  below,
}: {
  title: string
  children: ReactNode
  /** Small line inside the card, under the form (e.g. "New here? Create an account"). */
  footer?: ReactNode
  /** Small muted line under the card. */
  below?: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-background px-4 pt-14 pb-10 sm:pt-20">
      <BrandMark className="mb-8" />
      <div className="w-full max-w-[400px] rounded-2xl border bg-card p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <div className="mt-6 flex flex-col gap-5">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
      {below ? <div className="mt-6 text-center text-sm text-muted-foreground">{below}</div> : null}
    </div>
  )
}

/** "or" divider used between a form and an alternative sign-in option. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
