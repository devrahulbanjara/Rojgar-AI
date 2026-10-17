'use client'

import { useMemo, useState } from 'react'

import { PLANS, type PlanId } from '@/lib/api/company'
import { shortDate } from '@/lib/dates'
import { notify } from '@/lib/notify'
import type { BusinessStatus } from '@/lib/types/user'
import {
  type BusinessRow,
  useGetBusinessesQuery,
  useRestoreBusinessMutation,
  useSuspendBusinessMutation,
} from '@/store/services/adminApi'
import type { ColumnDef } from '@tanstack/react-table'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/Feedback'
import { FilterChips } from '@/components/app/FilterChips'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusPill, type Tone } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'

import { ReasonDialog } from './ReasonDialog'
import { adminError } from './adminError'

export const BUSINESS_STATUS: Record<BusinessStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Waiting for approval', tone: 'warning' },
  active: { label: 'Verified', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'danger' },
  rejected: { label: 'Not approved', tone: 'neutral' },
}

const SUSPEND_LINES = [
  'Jobs asked applicants for money.',
  'Several applicants reported fake jobs.',
  'We could not confirm this business.',
]

type Filter = 'all' | BusinessStatus

function planName(plan: string): string {
  return PLANS[plan as PlanId]?.name ?? plan
}

function RowAction({ row }: { row: BusinessRow }) {
  const [suspend] = useSuspendBusinessMutation()
  const [restore, restoring] = useRestoreBusinessMutation()

  if (row.status === 'suspended') {
    return (
      <Button
        size="sm"
        variant="outline"
        loading={restoring.isLoading}
        onClick={() =>
          void restore(row.id)
            .unwrap()
            .then(() => notify.success(`${row.name} restored`))
            .catch((error: unknown) => notify.error(adminError(error)))
        }
      >
        Restore
      </Button>
    )
  }
  if (row.status !== 'active') return null
  return (
    <ReasonDialog
      trigger={
        <Button size="sm" variant="ghost">
          Suspend
        </Button>
      }
      title={`Suspend ${row.name}?`}
      label="Reason (the owner sees this)"
      suggestions={SUSPEND_LINES}
      confirmLabel="Suspend"
      destructive
      onConfirm={async (reason) => {
        try {
          await suspend({ id: row.id, reason }).unwrap()
          notify.success(`${row.name} suspended. Its jobs are hidden.`)
        } catch (error) {
          notify.error(adminError(error))
          throw error
        }
      }}
    />
  )
}

const columns: ColumnDef<BusinessRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column} label="Business" />,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">{row.original.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {[row.original.business_type, row.original.district].filter(Boolean).join(' · ')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = BUSINESS_STATUS[row.original.status]
      return <StatusPill tone={status.tone}>{status.label}</StatusPill>
    },
  },
  {
    id: 'plan',
    accessorFn: (row) => planName(row.plan),
    header: 'Plan',
    meta: { className: 'hidden md:table-cell' },
  },
  {
    accessorKey: 'members',
    header: 'Team',
    meta: { className: 'hidden md:table-cell text-right' },
  },
  {
    accessorKey: 'jobs',
    header: 'Jobs',
    meta: { className: 'hidden md:table-cell text-right' },
  },
  {
    accessorKey: 'open_reports',
    header: 'Reports',
    meta: { className: 'hidden sm:table-cell text-right' },
    cell: ({ row }) =>
      row.original.open_reports ? (
        <StatusPill tone="danger">{row.original.open_reports}</StatusPill>
      ) : (
        <span className="text-muted-foreground">0</span>
      ),
  },
  {
    id: 'created_at',
    accessorFn: (row) => new Date(row.created_at).getTime(),
    header: 'Joined',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {shortDate(row.original.created_at)}
      </span>
    ),
  },
  {
    id: 'action',
    header: () => <span className="sr-only">Action</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowAction row={row.original} />
      </div>
    ),
  },
]

/** Every business: search, status, plan and usage; suspend or restore. */
export function BusinessesView() {
  const { data, isLoading, isError, isFetching, refetch } = useGetBusinessesQuery()
  const [filter, setFilter] = useState<Filter>('all')
  const all = useMemo(() => data?.data ?? [], [data])
  const rows = useMemo(
    () => (filter === 'all' ? all : all.filter((b) => b.status === filter)),
    [all, filter],
  )
  const count = (status: BusinessStatus) => all.filter((b) => b.status === status).length

  return (
    <PageContainer>
      <PageHeader title="Businesses" />
      <FilterChips
        label="Status"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', count: all.length },
          { value: 'active', label: 'Verified', count: count('active') },
          { value: 'pending', label: 'Waiting', count: count('pending') },
          { value: 'suspended', label: 'Suspended', count: count('suspended') },
          { value: 'rejected', label: 'Not approved', count: count('rejected') },
        ]}
      />
      {isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load businesses.
        </ErrorState>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(row) => row.id}
          searchPlaceholder="Search by name or district"
          initialSorting={[{ id: 'created_at', desc: true }]}
          pageSizes={[25, 50, 100]}
          emptyText="No businesses."
        />
      )}
    </PageContainer>
  )
}
