'use client'

import type { ReactNode } from 'react'

import { useT } from '@/lib/i18n/client'

import { LanguageToggle } from '@/components/app/LanguageToggle'
import { BrandMark } from '@/components/app/PublicNav'

/** The one auth layout: wordmark + language toggle, a narrow card with a one-line title, and optional footers. */
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
      <div className="mb-8 flex w-full max-w-[400px] items-center justify-between gap-3">
        <BrandMark />
        <LanguageToggle />
      </div>
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
  const t = useT()
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {t.auth.or}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
