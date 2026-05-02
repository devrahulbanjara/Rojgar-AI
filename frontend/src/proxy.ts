import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PREFIXES = ['/candidate', '/recruiter']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (
    isProtected &&
    !request.cookies.has('auth_present') &&
    !request.cookies.has('refresh_token')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/candidate/:path*', '/recruiter/:path*'],
}
