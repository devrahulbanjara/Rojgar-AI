'use client'

import { type ReactNode, useState } from 'react'

import Link from 'next/link'

import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'

import { LanguageToggle } from '@/components/app/LanguageToggle'
import { Logo } from '@/components/app/Logo'
import { MenuIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export type NavLink = { href: string; label: string }

/** The wordmark. Links home; the name comes from lib/brand.ts. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center', className)}>
      <Logo className="h-7" />
    </Link>
  )
}

/** Top bar for every public page: wordmark, a few links, the language toggle and the page's actions. */
export function PublicNav({
  links = [],
  actions,
  className,
}: {
  links?: NavLink[]
  actions?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const t = useT()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/70 bg-background',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandMark />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="hidden items-center gap-2 md:flex">{actions}</div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <IconButton label={t.nav.menu} className="md:hidden">
                <MenuIcon className="size-5" />
              </IconButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandMark />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Main" className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </nav>
              <div className="flex flex-col gap-2 px-4 pt-2" onClick={() => setOpen(false)}>
                {actions}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
