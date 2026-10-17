'use client'

import { type ReactNode, useState } from 'react'

import Link from 'next/link'

import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export type NavLink = { href: string; label: string }

/** The wordmark. Links home; the name comes from lib/brand.ts. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-lg bg-primary">
        <span className="size-2.5 rounded-full bg-primary-foreground" />
      </span>
      {BRAND.name}
    </Link>
  )
}

/** Top bar for every public page: wordmark, a few links, and the page's actions. */
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

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md',
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

        <div className="hidden items-center gap-2 md:flex">{actions}</div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
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
    </header>
  )
}
