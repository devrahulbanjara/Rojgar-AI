'use client'

import { useMemo } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ago } from '@/lib/dates'
import { useAppSelector } from '@/store/hooks'
import { type AuditLogItem, useGetCompanyAuditLogsQuery } from '@/store/services/auditApi'
import { useGetCompanyRecruitersQuery } from '@/store/services/companyApi'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { FilterChips } from '@/components/app/FilterChips'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusPill } from '@/components/app/StatusPill'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const AREAS = [
  { value: 'all', label: 'All' },
  { value: 'auth', label: 'Sign-in' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'pipeline', label: 'Candidates' },
  { value: 'outreach', label: 'Emails' },
  { value: 'interviews', label: 'Interviews' },
] as const

const AREA_LABEL: Record<string, string> = Object.fromEntries(AREAS.map((a) => [a.value, a.label]))

const EVERYONE = '__everyone'

const PAST: Record<string, string> = { create: 'Created', update: 'Updated', delete: 'Deleted' }

/** "create" + "job" → "Created job" when the backend sent no message. */
function describe(action: string, entity: string): string {
  const verb = PAST[action] ?? action.replace(/[._]+/g, ' ').trim()
  const text = `${verb} ${entity.replace(/[._]+/g, ' ')}`.trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

type Row = AuditLogItem & { who: string; what: string }

const columns: ColumnDef<Row>[] = [
  {
    id: 'created_at',
    accessorFn: (row) => new Date(row.created_at).getTime(),
    header: ({ column }) => <SortableHeader column={column} label="When" />,
    cell: ({ row }) => (
      <span
        className="text-sm whitespace-nowrap text-muted-foreground"
        title={format(new Date(row.original.created_at), 'EEE d MMM yyyy, h:mm a')}
      >
        {ago(row.original.created_at)}
      </span>
    ),
  },
  {
    accessorKey: 'who',
    meta: { className: 'hidden sm:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="Who" />,
    cell: ({ row }) => <span className="text-sm whitespace-nowrap">{row.original.who}</span>,
  },
  {
    accessorKey: 'what',
    header: () => <span className="text-xs font-medium">What happened</span>,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="line-clamp-2 text-sm text-foreground">{row.original.what}</span>
        <span className="text-xs text-muted-foreground sm:hidden">{row.original.who}</span>
      </div>
    ),
  },
  {
    id: 'area',
    meta: { className: 'hidden md:table-cell' },
    header: () => <span className="text-xs font-medium">Area</span>,
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {AREA_LABEL[row.original.category ?? ''] ?? '—'}
      </span>
    ),
  },
  {
    id: 'result',
    meta: { className: 'hidden md:table-cell' },
    header: () => <span className="sr-only">Result</span>,
    cell: ({ row }) =>
      row.original.success ? null : <StatusPill tone="danger">Failed</StatusPill>,
  },
]

function AuditSkeleton() {
  return (
    <div className="rounded-xl border bg-card" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b px-4 py-3.5 last:border-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="hidden h-4 w-28 sm:block" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </div>
  )
}

/** Admins: who did what, filterable by area and person. */
export function AuditView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const area = (AREAS.find((a) => a.value === params.get('area'))?.value ?? 'all') as string
  const person = params.get('person') ?? EVERYONE

  const recruiters = useGetCompanyRecruitersQuery().data
  const members = useMemo(() => recruiters?.data ?? [], [recruiters])
  const { data, isLoading, isError, isFetching, refetch } = useGetCompanyAuditLogsQuery({
    limit: 300,
    ...(area !== 'all' ? { category: area } : {}),
    ...(person !== EVERYONE ? { actor_user_id: person } : {}),
  })

  const me = useAppSelector((s) => s.auth.user)
  const names = useMemo(() => {
    const map = new Map(members.map((m) => [m.user_id, m.full_name]))
    if (me) map.set(me.id, me.full_name)
    return map
  }, [members, me])
  const rows = useMemo<Row[]>(
    () =>
      (data?.data ?? []).map((item) => ({
        ...item,
        who: item.actor_user_id ? (names.get(item.actor_user_id) ?? 'Someone') : 'System',
        what: item.message || describe(item.action_type, item.entity_type),
      })),
    [data, names],
  )

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  return (
    <PageContainer>
      <PageHeader breadcrumb={[{ label: 'Team', href: '/recruiter/team' }]} title="Audit log" />
      <div className="flex flex-wrap items-center gap-3">
        <FilterChips
          label="Area"
          value={area}
          onChange={(value) => setParam('area', value === 'all' ? null : value)}
          options={[...AREAS]}
        />
        <Select
          value={person}
          onValueChange={(value) => setParam('person', value === EVERYONE ? null : value)}
        >
          <SelectTrigger
            className="w-full rounded-full bg-card sm:ml-auto sm:w-56"
            aria-label="Person"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EVERYONE}>Everyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <AuditSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load the audit log.
        </ErrorState>
      ) : rows.length === 0 ? (
        <EmptyState>
          {area !== 'all' || person !== EVERYONE ? 'Nothing matches.' : 'Nothing recorded yet.'}
        </EmptyState>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          initialSorting={[{ id: 'created_at', desc: true }]}
          pageSizes={[25, 50, 100]}
        />
      )}
    </PageContainer>
  )
}
