'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { shortDate } from '@/lib/dates'
import { notify } from '@/lib/notify'
import { ROLE_LABEL } from '@/lib/session'
import type { BusinessRole } from '@/lib/types/user'
import { useAppSelector } from '@/store/hooks'
import {
  type TeamMember,
  useCreateInviteMutation,
  useGetTeamQuery,
  useRemoveMemberMutation,
} from '@/store/services/companyApi'
import type { ColumnDef } from '@tanstack/react-table'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { PersonCell } from '@/components/app/PersonCell'
import { Section } from '@/components/app/Section'
import { StatusPill } from '@/components/app/StatusPill'
import { LinkIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

/** Business team view: members, roles, remove with undo, and invite links. */
export function TeamView() {
  const me = useAppSelector((s) => s.auth.user)
  const businessId = me?.active_business?.business_id
  const isOwner = me?.active_business?.role === 'owner'
  const { data, isLoading, isError, isFetching, refetch } = useGetTeamQuery(businessId ?? '', {
    skip: !businessId,
  })
  const [removeMember] = useRemoveMemberMutation()
  const [createInvite, { isLoading: creatingInvite }] = useCreateInviteMutation()
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const all = useMemo(() => data?.data ?? [], [data])
  const members = useMemo(() => all.filter((m) => !hidden.has(m.membership_id)), [all, hidden])

  async function copyInvite() {
    if (!businessId) return
    try {
      const res = await createInvite({ businessId, role: 'interviewer' }).unwrap()
      if (res.data?.url) {
        await navigator.clipboard.writeText(res.data.url)
        notify.success('Invite link copied', 'Valid for 7 days. Send it to your teammate.')
      }
    } catch {
      notify.error("Couldn't create invite link. Try again.")
    }
  }

  function remove(member: TeamMember) {
    if (!businessId) return
    setHidden((prev) => new Set(prev).add(member.membership_id))
    const restore = () =>
      setHidden((prev) => {
        const next = new Set(prev)
        next.delete(member.membership_id)
        return next
      })
    notify.undoable(`Removed ${member.full_name}`, {
      onUndo: restore,
      onCommit: () => {
        removeMember({ businessId, membershipId: member.membership_id })
          .unwrap()
          .catch(() => {
            restore()
            notify.error(`Couldn't remove ${member.full_name}. Try again.`)
          })
      },
    })
  }

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
      cell: ({ row }) => (
        <PersonCell
          name={row.original.full_name + (row.original.user_id === me?.id ? ' (you)' : '')}
          meta={row.original.email ?? row.original.phone}
          src={row.original.avatar_url}
        />
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <SortableHeader column={column} label="Role" />,
      cell: ({ row }) => (
        <StatusPill tone={row.original.role === 'owner' ? 'success' : 'neutral'}>
          {ROLE_LABEL[row.original.role as BusinessRole] ?? row.original.role}
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
          isOwner ? (
            <Button onClick={() => void copyInvite()} disabled={!businessId || creatingInvite}>
              <LinkIcon />
              Copy invite link
            </Button>
          ) : undefined
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/recruiter/audit">Audit log</Link>
          </Button>
        }
      />

      {isLoading ? (
        <TeamSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load your team.
        </ErrorState>
      ) : members.length === 0 ? (
        <EmptyState>Only you so far.</EmptyState>
      ) : (
        <Section title="Members">
          <DataTable
            columns={columns}
            data={members}
            getRowId={(row) => row.membership_id}
            initialSorting={[{ id: 'full_name', desc: false }]}
          />
        </Section>
      )}
    </PageContainer>
  )
}
