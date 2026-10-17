'use client'

import { usePathname } from 'next/navigation'

import { isAuthPath } from '@/lib/publicRoutes'

import { PublicFooter } from '@/components/app/PublicFooter'

export default function Footer() {
  const pathname = usePathname()
  if (isAuthPath(pathname)) return null
  return <PublicFooter />
}
