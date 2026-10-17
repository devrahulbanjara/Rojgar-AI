'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { notify } from '@/lib/notify'
import { ROLE_LABEL, displayName } from '@/lib/session'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useLogoutMutation, useSetActiveBusinessMutation } from '@/store/services/authApi'
import { baseApi } from '@/store/services/baseApi'

import {
  AuditIcon,
  BusinessIcon,
  CheckIcon,
  CompanyIcon,
  FileIcon,
  SignOutIcon,
  StaffIcon,
  UserIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { EntityAvatar } from './EntityAvatar'

/** Signs out everywhere and goes to `to` (log in by default). */
export function useLogout(to = '/login') {
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
    router.replace(to)
  }
}

/** Avatar + name + role, opening profile, business, switching business and log out. */
export function AccountMenu({ showName = true }: { showName?: boolean }) {
  const user = useAppSelector((s) => s.auth.user)
  const router = useRouter()
  const inAdmin = usePathname()?.startsWith('/admin') ?? false
  const handleLogout = useLogout()
  const [switchBusiness] = useSetActiveBusinessMutation()
  const active = user?.active_business ?? null
  const memberships = user?.memberships ?? []
  const roleLine =
    inAdmin || (!active && user?.is_platform_admin)
      ? 'Rojgar AI staff'
      : active
        ? `${ROLE_LABEL[active.role]} · ${active.business_name}`
        : 'Applicant'

  async function switchTo(businessId: string, name: string) {
    try {
      await switchBusiness({ business_id: businessId }).unwrap()
      router.push('/recruiter')
      notify.success(`Now working in ${name}`)
    } catch {
      notify.error("Couldn't switch business. Try again.")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2.5 p-0.5 pr-2 text-left font-normal"
          aria-label="Account menu"
        >
          <EntityAvatar name={displayName(user)} src={user?.avatar_url} className="size-8" />
          {showName ? (
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="max-w-44 truncate text-sm font-medium">{displayName(user)}</span>
              <span className="max-w-44 truncate text-xs text-muted-foreground">{roleLine}</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {showName ? (
          // The trigger hides the name on phones; say who and where here instead.
          <>
            <DropdownMenuLabel className="flex flex-col font-normal sm:hidden">
              <span className="truncate text-sm font-medium">{displayName(user)}</span>
              <span className="truncate text-xs text-muted-foreground">{roleLine}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="sm:hidden" />
          </>
        ) : null}
        {active ? (
          <DropdownMenuItem asChild>
            <Link href="/recruiter/settings">
              <UserIcon />
              Profile
            </Link>
          </DropdownMenuItem>
        ) : null}
        {active?.role === 'owner' ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/recruiter/settings/company">
                <CompanyIcon />
                Business
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
        {user?.has_applications || (!active && !user?.is_platform_admin) ? (
          <DropdownMenuItem asChild>
            <Link href="/me/applications">
              <FileIcon />
              My applications
            </Link>
          </DropdownMenuItem>
        ) : null}
        {user?.is_platform_admin && !inAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <StaffIcon />
              Staff panel
            </Link>
          </DropdownMenuItem>
        ) : null}
        {inAdmin && active ? (
          <DropdownMenuItem asChild>
            <Link href="/recruiter">
              <BusinessIcon />
              {active.business_name}
            </Link>
          </DropdownMenuItem>
        ) : null}
        {memberships.length > 1 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Your businesses
            </DropdownMenuLabel>
            {memberships.map((m) => (
              <DropdownMenuItem
                key={m.business_id}
                aria-current={m.active || undefined}
                onSelect={() => {
                  if (!m.active) void switchTo(m.business_id, m.business_name)
                }}
              >
                {m.active ? <CheckIcon /> : <BusinessIcon />}
                <span className="truncate">{m.business_name}</span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        {!active && !user?.is_platform_admin ? (
          <DropdownMenuItem asChild>
            <Link href="/start">
              <BusinessIcon />
              Add your business
            </Link>
          </DropdownMenuItem>
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
