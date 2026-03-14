'use client'

/**
 * Safety-net redirect shim.
 *
 * The backend redirects the browser to /auth/oauth-callback, but this
 * file lives at (auth)/oauth-callback which Next.js resolves to /oauth-callback
 * (route groups don't add a URL segment).
 *
 * If the user somehow lands here, immediately forward all query params to
 * the real handler at /auth/oauth-callback.
 */
import { Suspense, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

function OAuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams.toString()
    router.replace(`/auth/oauth-callback${qs ? `?${qs}` : ''}`)
  }, [router, searchParams])

  return null
}

export default function OAuthCallbackRedirect() {
  return (
    <Suspense>
      <OAuthCallbackInner />
    </Suspense>
  )
}
