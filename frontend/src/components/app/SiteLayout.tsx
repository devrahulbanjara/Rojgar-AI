'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isAuthPath } from '@/lib/publicRoutes'

import { Button } from '@/components/ui/button'

import { CookieBanner } from './CookieBanner'
import { PublicFooter } from './PublicFooter'
import { PublicNav } from './PublicNav'

/** Signed-in app routes bring their own shell (sidebar + top bar). */
export const APP_PREFIXES = ['/recruiter', '/notifications']

export const isAppPath = (pathname: string | null) =>
  !!pathname && APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
]

/** Public chrome around every page that isn't part of the signed-in app. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (isAppPath(pathname)) {
    return (
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    )
  }

  const bare = isAuthPath(pathname)
  return (
    <>
      {bare ? null : <CookieBanner />}
      {bare ? null : (
        <PublicNav
          links={LINKS}
          actions={
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signup?role=company">Start hiring</Link>
              </Button>
            </>
          }
        />
      )}
      <main id="main-content" tabIndex={-1} className="page">
        {children}
      </main>
      {bare ? null : <PublicFooter />}
    </>
  )
}
