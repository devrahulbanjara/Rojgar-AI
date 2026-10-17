'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { ROLE_DASHBOARDS } from '@/lib/roleRoutes'
import { useAppSelector } from '@/store/hooks'

/** Sends signed-in users straight to their workspace instead of the marketing page. */
export function RedirectSignedIn() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = ROLE_DASHBOARDS[user.primary_role]
      if (dest) router.replace(dest)
    }
  }, [isAuthenticated, user, router])

  return null
}
