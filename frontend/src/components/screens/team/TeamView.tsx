'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { parseApiError } from '@/lib/apiError'
import { shortDate } from '@/lib/dates'
import { notify } from '@/lib/notify'
import { ROLE_LABEL, localPhone } from '@/lib/session'
import type { BusinessRole } from '@/lib/types/user'
import { useAppSelector } from '@/store/hooks'
import {
  type Invite,
  type TeamMember,
  useChangeMemberRoleMutation,
  useGetInvitesQuery,
  useGetTeamQuery,
  useRemoveMemberMutation,
  useRevokeInviteMutation,
} from '@/store/services/companyApi'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNowStrict } from 'date-fns'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { PersonCell } from '@/components/app/PersonCell'
import { Section } from '@/components/app/Section'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { InviteDialog } from './InviteDialog'

const ROLES: BusinessRole[] = ['owner', 'manager', 'interviewer']

function TeamSkeleton() {
  return (
    <div className="rounded-xl border bg-card" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Invite links nobody has used yet, with Cancel. */
function OpenInvites({ businessId }: { businessId: string }) {
  const { data } = useGetInvitesQuery(businessId)
  const [revoke] = useRevokeInviteMutation()
  const invites = data?.data ?? []
  if (!invites.length) return null

  async function cancel(invite: Invite) {
    try {
      await revoke({ businessId, inviteId: invite.id }).unwrap()
      notify.success('Invite link cancelled')
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't cancel the link. Try again.").message)
    }
  }

  return (
    <Section title="Invite links not used yet">
      <ul className="divide-y rounded-xl border bg-card">
        {invites.map((invite) => (
          <li key={invite.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{ROLE_LABEL[invite.role]}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  invite.created_by_name ? `Made by ${invite.created_by_name}` : null,
                  `Works for ${formatDistanceToNowStrict(new Date(invite.expires_at))} more`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => void cancel(invite)}>
              Cancel link
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** Owners: who is on the team, their roles, invite links; remove with Undo. */
export function TeamView() {
  const me = useAppSelector((s) => s.auth.user)
  const business = me?.active_business
  const businessId = business?.business_id
  const isOwner = business?.role === 'owner'
  const { data, isLoading, isError, isFetching, refetch } = useGetTeamQuery(businessId ?? '', {
    skip: !businessId,
  })
  const [removeMember] = useRemoveMemberMutation()
  const [changeRole] = useChangeMemberRoleMutation()
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const members = useMemo(
    () => (data?.data ?? []).filter((m) => !hidden.has(m.membership_id)),
    [data, hidden],
  )

  function remove(member: TeamMember) {
    if (!businessId) return
    setHidden((prev) => new Set(prev).add(member.membership_id))
    const restore = () =>
      setHidden((prev) => {
        const next = new Set(prev)
        next.delete(member.membership_id)
        return next
      })
    notify.undoable(`Removed ${member.full_name || localPhone(member.phone)}`, {
      onUndo: restore,
      onCommit: () => {
        removeMember({ businessId, membershipId: member.membership_id })
          .unwrap()
          .catch((error: unknown) => {
            restore()
            notify.error(parseApiError(error, {}, "Couldn't remove them. Try again.").message)
          })
      },
    })
  }

  async function setRole(member: TeamMember, role: BusinessRole) {
    if (!businessId || role === member.role) return
    const before = member.role
    const name = member.full_name || localPhone(member.phone) || 'They'
    try {
      await changeRole({ businessId, membershipId: member.membership_id, role }).unwrap()
      notify.undoable(`${name} is now ${ROLE_LABEL[role]}`, {
        onUndo: () =>
          void changeRole({ businessId, membershipId: member.membership_id, role: before }),
      })
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't change the role. Try again.").message)
    }
  }

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
      cell: ({ row }) => (
        <PersonCell
          name={row.original.full_name || localPhone(row.original.phone) || 'No name yet'}
          meta={[
            row.original.user_id === me?.id ? 'You' : null,
            row.original.email ?? localPhone(row.original.phone),
          ]
            .filter(Boolean)
            .join(' · ')}
          src={row.original.avatar_url}
        />
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <SortableHeader column={column} label="Role" />,
      cell: ({ row }) =>
        isOwner && row.original.user_id !== me?.id ? (
          <Select
            value={row.original.role}
            onValueChange={(value) => void setRole(row.original, value as BusinessRole)}
          >
            <SelectTrigger
              size="sm"
              className="w-36 rounded-full bg-card"
              aria-label={`Role of ${row.original.full_name}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <StatusPill tone={row.original.role === 'owner' ? 'success' : 'neutral'}>
            {ROLE_LABEL[row.original.role]}
          </StatusPill>
        ),
    },
    {
      accessorKey: 'joined_at',
      meta: { className: 'hidden sm:table-cell' },
      header: ({ column }) => <SortableHeader column={column} label="Joined" />,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {shortDate(row.original.joined_at)}
        </span>
      ),
    },
    {
      id: 'remove',
      header: () => <span className="sr-only">Remove</span>,
      cell: ({ row }) =>
        !isOwner || row.original.user_id === me?.id ? null : (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => remove(row.original)}>
              Remove
            </Button>
          </div>
        ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Team"
        facts={
          members.length
            ? [`${members.length} ${members.length === 1 ? 'person' : 'people'}`]
            : undefined
        }
        primaryAction={
          isOwner && business ? (
            <InviteDialog businessId={business.business_id} businessName={business.business_name} />
          ) : undefined
        }
        secondaryAction={
          isOwner ? (
            <Button asChild variant="outline">
              <Link href="/recruiter/audit">Audit log</Link>
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <TeamSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load your team.
        </ErrorState>
      ) : (
        <DataTable
          columns={columns}
          data={members}
          getRowId={(row) => row.membership_id}
          initialSorting={[{ id: 'full_name', desc: false }]}
        />
      )}

      {isOwner && businessId ? <OpenInvites businessId={businessId} /> : null}
    </PageContainer>
  )
}
