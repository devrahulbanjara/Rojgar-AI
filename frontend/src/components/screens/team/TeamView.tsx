'use client'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { shortDate } from '@/lib/dates'
import { notify } from '@/lib/notify'
import { useAppSelector } from '@/store/hooks'
import {
  type RecruiterMember,
  useGetCompanyRecruitersQuery,
  useGetMyCompanyQuery,
  useRemoveRecruiterMutation,
  useUpdateRecruiterStatusMutation,
} from '@/store/services/companyApi'
import type { ColumnDef } from '@tanstack/react-table'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { PersonCell } from '@/components/app/PersonCell'
import { Section } from '@/components/app/Section'
import { LinkIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function JoinRequests({ requests }: { requests: RecruiterMember[] }) {
  const [updateStatus] = useUpdateRecruiterStatusMutation()
  const [busy, setBusy] = useState<string | null>(null)

  async function decide(member: RecruiterMember, status: 'active' | 'rejected') {
    setBusy(member.membership_id)
    try {
      await updateStatus({ membershipId: member.membership_id, status }).unwrap()
      notify.success(
        status === 'active'
          ? `${member.full_name} can now sign in`
          : `Declined ${member.full_name}`,
      )
    } catch {
      notify.error("Couldn't update the request. Try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Section title={`Waiting to join (${requests.length})`}>
      <ul className="divide-y rounded-xl border bg-card">
        {requests.map((member) => (
          <li key={member.membership_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <PersonCell
              name={member.full_name}
              meta={member.email}
              src={member.avatar_url}
              className="flex-1 basis-56"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy === member.membership_id}
                onClick={() => void decide(member, 'rejected')}
              >
                Decline
              </Button>
              <Button
                size="sm"
                loading={busy === member.membership_id}
                onClick={() => void decide(member, 'active')}
              >
                Approve
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

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

/** Admins: who is on the team, who is waiting to join, and an invite link. */
export function TeamView() {
  const me = useAppSelector((s) => s.auth.user)
  const { data, isLoading, isError, isFetching, refetch } = useGetCompanyRecruitersQuery()
  const company = useGetMyCompanyQuery().data?.data
  const [removeRecruiter] = useRemoveRecruiterMutation()
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const all = useMemo(() => data?.data ?? [], [data])
  const pending = all.filter((m) => m.status === 'pending')
  const members = useMemo(() => {
    const active = all.filter((m) => m.status === 'active' && !hidden.has(m.membership_id))
    if (!me || active.some((m) => m.user_id === me.id)) return active
    // The admin isn't in the recruiters list; show them too so the count is right.
    const self: RecruiterMember = {
      membership_id: `self-${me.id}`,
      user_id: me.id,
      full_name: me.full_name,
      email: me.email,
      avatar_url: me.avatar_url,
      status: 'active',
      joined_at: me.created_at,
    }
    return [self, ...active]
  }, [all, hidden, me])

  async function copyInvite() {
    if (!company) return
    const url = `${window.location.origin}/signup?role=company&join=${encodeURIComponent(company.name)}`
    try {
      await navigator.clipboard.writeText(url)
      notify.success('Invite link copied', 'Send it to your teammate. You approve them here.')
    } catch {
      notify.error(`Couldn't copy. Send this link instead: ${url}`)
    }
  }

  function remove(member: RecruiterMember) {
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
        removeRecruiter(member.membership_id)
          .unwrap()
          .catch(() => {
            restore()
            notify.error(`Couldn't remove ${member.full_name}. Try again.`)
          })
      },
    })
  }

  const columns: ColumnDef<RecruiterMember>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortableHeader column={column} label="Name" />,
      cell: ({ row }) => (
        <PersonCell
          name={row.original.full_name + (row.original.user_id === me?.id ? ' (you)' : '')}
          meta={row.original.email}
          src={row.original.avatar_url}
        />
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
        row.original.user_id === me?.id ? null : (
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
          <Button onClick={() => void copyInvite()} disabled={!company}>
            <LinkIcon />
            Copy invite link
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/recruiter/audit">Audit log</Link>
          </Button>
        }
      />

      {pending.length ? <JoinRequests requests={pending} /> : null}

      {isLoading ? (
        <TeamSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load your team.
        </ErrorState>
      ) : members.length === 0 ? (
        <EmptyState>Only you so far.</EmptyState>
      ) : (
        <Section title={pending.length ? 'Members' : null}>
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
