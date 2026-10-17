'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'
import { useAppSelector } from '@/store/hooks'

import { useLogout } from '@/components/app/AccountMenu'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { LanguageToggle } from '@/components/app/LanguageToggle'
import { Logo } from '@/components/app/Logo'
import { SignOutIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** Frame for a signed-in applicant (/me/**): no marketing links, just their applications. */
export function ApplicantShell({ children }: { children: ReactNode }) {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)
  const signOut = useLogout('/')
  const name = user?.full_name ?? ''

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/me/applications" className="inline-flex shrink-0 items-center">
            <Logo variant="mark" className="size-8 sm:hidden" />
            <Logo className="hidden h-7 sm:block" />
          </Link>
          <nav aria-label="Main" className="min-w-0 flex-1">
            <Link
              href="/me/applications"
              aria-current="page"
              className="truncate text-sm font-medium text-foreground"
            >
              {t.nav.myApplications}
            </Link>
          </nav>
          <LanguageToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto gap-2 rounded-full p-0.5 font-normal sm:pr-3"
                aria-label={t.nav.account}
              >
                <EntityAvatar name={name || '?'} src={user?.avatar_url} className="size-8" />
                <span className="hidden max-w-32 truncate text-sm sm:inline">{name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {name ? (
                <>
                  <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem onSelect={() => void signOut()}>
                <SignOutIcon />
                {t.nav.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="page">
        {children}
      </main>
    </>
  )
}
