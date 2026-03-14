'use client'

import { usePathname } from 'next/navigation'

import CookieBanner from '@/components/common/CookieBanner'
import Footer from '@/components/common/footer'
import Header from '@/components/common/header'

const DASHBOARD_PREFIXES = ['/candidate', '/recruiter']

function isDashboardPath(pathname: string) {
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p))
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isDashboardPath(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="page">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  )
}
