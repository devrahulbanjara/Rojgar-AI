/** Routes that render a standalone card (auth, create a business, invites, application status) and skip the site header/footer. */
const AUTH_PATHS = [
  '/login',
  '/signup',
  '/signin',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/oauth-callback',
  '/start',
  '/invite',
  '/applications/status',
]

export function isAuthPath(pathname: string | null): boolean {
  if (!pathname) return false
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
