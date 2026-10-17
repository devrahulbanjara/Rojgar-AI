'use client'

import Link from 'next/link'

import { BRAND } from '@/lib/brand'
import { useT } from '@/lib/i18n/client'

import { BrandMark, type NavLink } from '@/components/app/PublicNav'

/** Footer for every public page: wordmark, a short row of links, copyright. */
export function PublicFooter({ links }: { links?: NavLink[] }) {
  const t = useT()
  const items = links ?? [
    { href: '/privacy', label: t.nav.privacy },
    { href: '/terms', label: t.nav.terms },
    { href: '/cookies', label: t.nav.cookies },
  ]
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <BrandMark />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {items.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>
    </footer>
  )
}
