/** Routes that render a standalone auth card and skip the site header/footer. */
const AUTH_PATHS = [
  '/login',
  '/signup',
  '/signin',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/oauth-callback',
  '/auth/oauth-callback',
]

export function isAuthPath(pathname: string | null): boolean {
  if (!pathname) return false
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
