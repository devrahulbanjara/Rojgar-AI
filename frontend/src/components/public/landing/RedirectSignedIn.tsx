'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { homePathFor } from '@/lib/roleRoutes'
import { useAppSelector } from '@/store/hooks'

import { useCandidateSession } from '@/components/me/useCandidateSession'

/** Sends signed-in users straight to their workspace, but only once the session is confirmed live. */
export function RedirectSignedIn() {
  const user = useAppSelector((s) => s.auth.user)
  const session = useCandidateSession()
  const router = useRouter()

  useEffect(() => {
    if (session.status === 'signed-in' && user) router.replace(homePathFor(user))
  }, [session.status, user, router])

  return null
}
