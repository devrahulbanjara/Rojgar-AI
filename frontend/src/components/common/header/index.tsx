'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isAuthPath } from '@/lib/publicRoutes'

import { PublicNav } from '@/components/app/PublicNav'
import { Button } from '@/components/ui/button'

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
]

/** Site header for public pages. Auth pages render their own centred card instead. */
export default function Header() {
  const pathname = usePathname()
  if (isAuthPath(pathname)) return null

  return (
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
  )
}
