'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'

import { PageContainer } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'

const TABS = [
  { href: '/recruiter/settings', label: 'Account' },
  { href: '/recruiter/settings/availability', label: 'Availability' },
  { href: '/recruiter/settings/company', label: 'Company', adminOnly: true },
]

/** "Settings" title and pill tabs: Account · Availability · Company (admins). */
export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = useAppSelector((s) => s.auth.user?.primary_role === 'recruiter_admin')

  return (
    <PageContainer narrow>
      <PageHeader title="Settings" />
      <nav aria-label="Settings" className="-mt-2 flex flex-wrap gap-1">
        {TABS.filter((tab) => isAdmin || !tab.adminOnly).map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium transition-colors',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'bg-card text-foreground hover:bg-accent',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </PageContainer>
  )
}

/** A white card holding one group of settings, with an optional footer action. */
export function SettingsCard({
  title,
  children,
  footer,
}: {
  /** Leave out when the tab already names the card (no repeated titles). */
  title?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
      {title ? (
        <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
      ) : null}
      {children}
      {footer ? <div className="flex justify-end gap-2">{footer}</div> : null}
    </section>
  )
}
