'use client'

import { useMemo } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ago } from '@/lib/dates'
import { locationTypeLabel } from '@/lib/jobHelpers'
import { useGetRecruiterJobsOverviewQuery } from '@/store/services/dashboardApi'
import type { ClosedReason, JobStatus } from '@/store/services/jobsApi'
import type { ColumnDef } from '@tanstack/react-table'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable, RowLink, SortableHeader } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { FilterChips } from '@/components/app/FilterChips'
import { PageHeader } from '@/components/app/PageHeader'
import { JobStatusPill } from '@/components/app/StatusPill'
import { PlusIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

import { JobRowActions } from './JobRowActions'

export type JobRow = {
  id: string
  title: string
  meta: string
  status: JobStatus
  closed_reason: ClosedReason | null
  closes_at: string | null
  createdAt: string
  applicants: number
  toReview: number
  href: string
}

type Filter = 'all' | 'open' | 'draft' | 'closed'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'closed', label: 'Closed' },
]

function matches(row: JobRow, filter: Filter): boolean {
  return filter === 'all' || row.status === filter
}

const columns: ColumnDef<JobRow>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <SortableHeader column={column} label="Job" />,
    cell: ({ row }) => (
      <Link
        href={row.original.href}
        className="flex max-w-[14rem] min-w-0 flex-col hover:underline sm:max-w-md"
      >
        <span className="truncate font-medium text-foreground">{row.original.title}</span>
        {row.original.meta ? (
          <span className="truncate text-xs text-muted-foreground">{row.original.meta}</span>
        ) : null}
      </Link>
    ),
  },
  {
    accessorKey: 'createdAt',
    meta: { className: 'hidden md:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="Posted" />,
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {ago(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: 'applicants',
    meta: { className: 'hidden sm:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="Applicants" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.applicants}</span>,
  },
  {
    accessorKey: 'toReview',
    meta: { className: 'hidden sm:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="To review" />,
    cell: ({ row }) =>
      row.original.toReview > 0 ? (
        <span className="font-medium text-primary tabular-nums">{row.original.toReview}</span>
      ) : (
        <span className="text-muted-foreground tabular-nums">0</span>
      ),
  },
  {
    id: 'status',
    meta: { className: 'hidden md:table-cell' },
    header: () => <span className="text-xs font-medium">Status</span>,
    cell: ({ row }) => <JobStatusPill job={row.original} />,
  },
  {
    id: 'open',
    header: () => <span className="sr-only">Open</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <RowLink href={row.original.href}>{row.original.toReview > 0 ? 'Review' : 'Open'}</RowLink>
        <JobRowActions row={row.original} />
      </div>
    ),
  },
]

export function JobsView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filter = (FILTERS.find((f) => f.value === params.get('status'))?.value ?? 'all') as Filter
  const query = params.get('q') ?? ''

  const jobs = useGetRecruiterJobsOverviewQuery(undefined, { refetchOnMountOrArgChange: true })

  const rows = useMemo<JobRow[]>(() => {
    const jobRows: JobRow[] = (jobs.data?.data ?? []).map((job) => ({
      id: job.job_id,
      title: job.title,
      meta: [job.location, locationTypeLabel(job.location_type)].filter(Boolean).join(' · '),
      status: job.status,
      closed_reason: job.hiring_completed ? 'hired' : null,
      closes_at: job.status === 'open' ? job.expires_at : null,
      createdAt: job.created_at,
      applicants: job.applicants,
      toReview: job.to_review,
      href: `/recruiter/jobs/${job.job_id}`,
    }))
    return jobRows
  }, [jobs.data])

  const counts = useMemo(
    () => ({
      open: rows.filter((r) => matches(r, 'open')).length,
      draft: rows.filter((r) => matches(r, 'draft')).length,
      closed: rows.filter((r) => matches(r, 'closed')).length,
    }),
    [rows],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => matches(row, filter) && (!q || row.title.toLowerCase().includes(q)))
  }, [rows, filter, query])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  const postJob = (
    <Button asChild>
      <Link href="/recruiter/jobs/new">
        <PlusIcon />
        Post a job
      </Link>
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader title="Jobs" primaryAction={postJob} />

      <div className="flex flex-wrap items-center gap-3">
        <FilterChips
          label="Filter jobs"
          value={filter}
          onChange={(value) => setParam('status', value === 'all' ? null : value)}
          options={FILTERS.map((f) => ({
            ...f,
            count: f.value === 'all' ? rows.length : counts[f.value],
          }))}
        />
        <div className="relative w-full sm:ml-auto sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setParam('q', event.target.value || null)}
            placeholder="Search jobs"
            className="rounded-full bg-card pl-9"
            aria-label="Search jobs"
          />
        </div>
      </div>

      {jobs.isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : jobs.isError ? (
        <ErrorState onRetry={() => void jobs.refetch()} retrying={jobs.isFetching}>
          Couldn&apos;t load jobs.
        </ErrorState>
      ) : rows.length === 0 ? (
        <EmptyState action={postJob}>No jobs yet.</EmptyState>
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(row) => row.id}
          emptyText="No jobs match."
        />
      )}
    </PageContainer>
  )
}
