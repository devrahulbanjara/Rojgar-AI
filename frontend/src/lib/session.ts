import type { BaseUser, BusinessRole } from '@/lib/types/user'
import { useAppSelector } from '@/store/hooks'

export const ROLE_LABEL: Record<BusinessRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  interviewer: 'Interviewer',
}

/** The business the signed-in person is working in now, if any. */
export function useActiveBusiness() {
  return useAppSelector((s) => s.auth.user?.active_business ?? null)
}

/** Owners manage the team, plan, business details and audit log. */
export function useIsOwner(): boolean {
  return useActiveBusiness()?.role === 'owner'
}

/** A name to show for a person who signed up by phone and hasn't added one yet. */
export function displayName(user: Pick<BaseUser, 'full_name' | 'phone'> | null | undefined) {
  return user?.full_name || user?.phone || 'You'
}
