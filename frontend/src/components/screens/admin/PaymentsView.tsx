'use client'

import { useState } from 'react'

import { PLANS, type PlanId } from '@/lib/api/company'
import { shortDate } from '@/lib/dates'
import { notify } from '@/lib/notify'
import {
  type PaidPlanRow,
  type PaymentRow,
  useGetPaymentsQuery,
  useMarkPaymentReceivedMutation,
} from '@/store/services/adminApi'
import type { ColumnDef } from '@tanstack/react-table'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable } from '@/components/app/DataTable'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { Section } from '@/components/app/Section'
import { StatusPill } from '@/components/app/StatusPill'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { adminError } from './adminError'

const npr = (amount: number) => `NPR ${amount.toLocaleString('en-IN')}`

/** Confirm the money arrived; the bank reference is optional. Applies the pass or plan. */
function MarkReceived({ payment }: { payment: PaymentRow }) {
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [mark, { isLoading }] = useMarkPaymentReceivedMutation()

  async function confirm() {
    try {
      await mark({ id: payment.id, reference: reference.trim() }).unwrap()
      notify.success(`${payment.item} is now active for ${payment.business_name}`)
      setOpen(false)
    } catch (error) {
      notify.error(adminError(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Mark received</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {npr(payment.amount_npr)} from {payment.business_name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bank-reference">Bank reference (optional)</Label>
          <Input
            id="bank-reference"
            className="h-10"
            maxLength={100}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={isLoading} onClick={() => void confirm()}>
            Mark received
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const transferColumns: ColumnDef<PaymentRow>[] = [
  {
    accessorKey: 'business_name',
    header: 'Business',
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {row.original.business_name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {[row.original.item, row.original.job_title].filter(Boolean).join(' · ')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'amount_npr',
    header: 'Amount',
    meta: { className: 'text-right' },
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">{npr(row.original.amount_npr)}</span>
    ),
  },
  {
    id: 'created_at',
    accessorFn: (row) => new Date(row.created_at).getTime(),
    header: 'Asked',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {shortDate(row.original.created_at)}
      </span>
    ),
  },
  {
    accessorKey: 'reference',
    header: 'Reference',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.reference ?? '—'}</span>
    ),
  },
  {
    id: 'status',
    header: () => <span className="sr-only">Status</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        {row.original.status === 'awaiting' ? (
          <MarkReceived payment={row.original} />
        ) : (
          <StatusPill tone="success">
            Received{row.original.received_at ? ` ${shortDate(row.original.received_at)}` : ''}
          </StatusPill>
        )}
      </div>
    ),
  },
]

const paidColumns: ColumnDef<PaidPlanRow>[] = [
  { accessorKey: 'business_name', header: 'Business' },
  {
    id: 'plan',
    accessorFn: (row) => PLANS[row.plan as PlanId]?.name ?? row.plan,
    header: 'Plan',
  },
  {
    accessorKey: 'active_passes',
    header: 'Live Job Passes',
    meta: { className: 'text-right' },
  },
]

/** Bank transfers to confirm, and who pays for what. */
export function PaymentsView() {
  const { data, isLoading, isError, isFetching, refetch } = useGetPaymentsQuery()
  // Transfers still to confirm first, newest first within each group.
  const transfers = [...(data?.data.transfers ?? [])].sort(
    (a, b) =>
      Number(a.status !== 'awaiting') - Number(b.status !== 'awaiting') ||
      b.created_at.localeCompare(a.created_at),
  )
  const paid = data?.data.paid ?? []
  const waiting = transfers.filter((t) => t.status === 'awaiting').length

  return (
    <PageContainer>
      <PageHeader title="Payments" facts={waiting ? [`${waiting} to confirm`] : undefined} />
      {isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load payments.
        </ErrorState>
      ) : (
        <>
          <Section title="Bank transfers">
            <DataTable
              columns={transferColumns}
              data={transfers}
              loading={isLoading}
              getRowId={(row) => row.id}
              pageSizes={[25, 50]}
              emptyText="No bank transfers yet."
            />
          </Section>
          <Section title="Paying businesses">
            <DataTable
              columns={paidColumns}
              data={paid}
              loading={isLoading}
              getRowId={(row) => row.business_id}
              emptyText="No paying businesses yet."
            />
          </Section>
        </>
      )}
    </PageContainer>
  )
}
