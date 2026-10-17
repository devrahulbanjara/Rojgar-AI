'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useT } from '@/lib/i18n/client'
import { isAuthPath } from '@/lib/publicRoutes'
import { useMounted } from '@/lib/useMounted'
import { useAppSelector } from '@/store/hooks'

import { Button } from '@/components/ui/button'

import { ApplicantShell } from './ApplicantShell'
import { CookieBanner } from './CookieBanner'
import { PublicFooter } from './PublicFooter'
import { PublicNav } from './PublicNav'

/** Signed-in app routes bring their own shell (sidebar + top bar). */
export const APP_PREFIXES = ['/recruiter', '/notifications']

const matches = (pathname: string | null, prefixes: string[]) =>
  !!pathname && prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

export const isAppPath = (pathname: string | null) => matches(pathname, APP_PREFIXES)

/** Where a signed-in person works: members in the business app, applicants in /me. */
function useSignedInHome(): string | null {
  const mounted = useMounted()
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)
  if (!mounted || !isAuthenticated || !user) return null
  return user.primary_role === 'candidate' ? '/me/applications' : '/recruiter'
}

/** Log in · Start hiring, or "Open Rojgar AI" once signed in. */
function NavActions() {
  const t = useT()
  const home = useSignedInHome()
  if (home) {
    return (
      <Button asChild>
        <Link href={home}>{t.nav.openApp}</Link>
      </Button>
    )
  }
  return (
    <>
      <Button asChild variant="ghost">
        <Link href="/login">{t.nav.logIn}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/signup?role=company">{t.nav.startHiring}</Link>
      </Button>
    </>
  )
}

/** Public chrome around every page that isn't part of the signed-in app. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const t = useT()

  if (isAppPath(pathname)) {
    return (
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    )
  }

  if (matches(pathname, ['/me'])) return <ApplicantShell>{children}</ApplicantShell>

  // Auth cards and the printable poster stand alone.
  const bare = isAuthPath(pathname) || !!pathname?.endsWith('/poster')
  return (
    <>
      {bare ? null : <CookieBanner />}
      {bare ? null : (
        <PublicNav
          links={[
            { href: '/#how', label: t.nav.howItWorks },
            { href: '/#pricing', label: t.nav.pricing },
          ]}
          actions={<NavActions />}
        />
      )}
      <main id="main-content" tabIndex={-1} className="page">
        {children}
      </main>
      {bare ? null : <PublicFooter />}
    </>
  )
}
