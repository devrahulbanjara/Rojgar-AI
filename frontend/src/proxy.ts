import { NextRequest, NextResponse } from 'next/server'

/** Need a session: business teams, platform staff, and creating a business. */
const PROTECTED_PREFIXES = ['/recruiter', '/notifications', '/admin', '/start']

/** Old URLs that moved, matched as a path prefix. The query string is kept. */
const MOVED: { from: string; to: string }[] = [
  // One sign-in page for everyone.
  { from: '/signin', to: '/login' },
  // Candidates no longer have a dashboard: everything goes to their applications.
  { from: '/candidate/notifications', to: '/notifications' },
  { from: '/candidate', to: '/me/applications' },
  { from: '/onboarding', to: '/me/applications' },
  { from: '/interviews', to: '/recruiter/interviews' },
  { from: '/recruiter/talent', to: '/recruiter/candidates' },
  { from: '/recruiter/applications', to: '/recruiter/candidates' },
  { from: '/recruiter/recruiters', to: '/recruiter/team' },
  { from: '/recruiter/chat', to: '/recruiter' },
  { from: '/recruiter/profile', to: '/recruiter/settings' },
  { from: '/recruiter/company', to: '/recruiter/settings/company' },
  { from: '/recruiter/interviews/', to: '/recruiter/interviews' },
]

function movedTo(pathname: string): string | null {
  for (const rule of MOVED) {
    const prefix = rule.from.endsWith('/') ? rule.from : `${rule.from}/`
    if (pathname === rule.from || pathname.startsWith(prefix)) return rule.to
  }
  return null
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // The audit log used to be a tab on Team.
  if (pathname === '/recruiter/team' && searchParams.get('tab') === 'audit') {
    const url = request.nextUrl.clone()
    url.pathname = '/recruiter/audit'
    url.searchParams.delete('tab')
    return NextResponse.redirect(url)
  }

  const target = movedTo(pathname)
  if (target) {
    const url = request.nextUrl.clone()
    url.pathname = target
    return NextResponse.redirect(url, 308)
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (
    isProtected &&
    !request.cookies.has('auth_present') &&
    !request.cookies.has('refresh_token')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/signin',
    '/candidate/:path*',
    '/onboarding/:path*',
    '/interviews/:path*',
    '/notifications/:path*',
    '/recruiter/:path*',
    '/admin/:path*',
    '/start/:path*',
  ],
}
