'use client'

import { useT } from '@/lib/i18n/client'
import { displayName } from '@/lib/session'
import { useAppSelector } from '@/store/hooks'

import { useLogout } from '@/components/app/AccountMenu'
import { Button } from '@/components/ui/button'

/** "Not Priya? Log out" under an auth card, for the signed-in person. */
export function SignedInAs({ to }: { to?: string }) {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)
  const logout = useLogout(to)
  if (!user) return null
  return (
    <>
      {t.auth.invite.notYou(displayName(user))}{' '}
      <Button variant="link" className="h-auto p-0 text-foreground" onClick={() => void logout()}>
        {t.auth.invite.logOut}
      </Button>
    </>
  )
}
