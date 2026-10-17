'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLogoutMutation } from '@/store/services/authApi'
import { baseApi } from '@/store/services/baseApi'

import { AuditIcon, CompanyIcon, SignOutIcon, UserIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { EntityAvatar } from './EntityAvatar'

const ROLE_LABEL = {
  recruiter_admin: 'Company admin',
  recruiter: 'Recruiter',
  candidate: 'Candidate',
} as const

export function useLogout() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [logout] = useLogoutMutation()
  return async () => {
    try {
      await logout().unwrap()
    } catch {
      // The mutation clears local credentials whether or not the call succeeds.
    }
    dispatch(baseApi.util.resetApiState())
    router.replace('/login')
  }
}

/** Avatar + name + role, opening profile/company/log out. */
export function AccountMenu({ showName = true }: { showName?: boolean }) {
  const user = useAppSelector((s) => s.auth.user)
  const handleLogout = useLogout()
  const role = user?.primary_role
  const isRecruiter = role === 'recruiter' || role === 'recruiter_admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2.5 p-0.5 pr-2 text-left font-normal"
          aria-label="Account menu"
        >
          <EntityAvatar name={user?.full_name ?? 'You'} src={user?.avatar_url} className="size-8" />
          {showName ? (
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="max-w-40 truncate text-sm font-medium">{user?.full_name}</span>
              <span className="text-xs text-muted-foreground">{role ? ROLE_LABEL[role] : ''}</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={isRecruiter ? '/recruiter/settings' : '/me/applications'}>
            <UserIcon />
            {isRecruiter ? 'Profile' : 'My applications'}
          </Link>
        </DropdownMenuItem>
        {role === 'recruiter_admin' ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/recruiter/settings/company">
                <CompanyIcon />
                Company
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/recruiter/audit">
                <AuditIcon />
                Audit log
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void handleLogout()}>
          <SignOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
