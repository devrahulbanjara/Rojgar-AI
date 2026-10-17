'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'
import { format, startOfYear, subDays } from 'date-fns'

import { PageContainer } from '@/components/app/AppShell'
import { DataTable } from '@/components/app/DataTable'
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

import {
  ChartCard,
  ProgressChart,
  ReplyChart,
  SourcesChart,
  WeeklyChart,
  formatDays,
} from './InsightsCharts'
import {
  type InsightsData,
  type InsightsJobReply,
  useGetRecruiterInsightsQuery,
} from './insightsApi'

type Range = '30d' | '90d' | 'year'
const RANGES: { value: Range; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: 'This year' },
]
const ALL_JOBS = 'all'

function rangeDates(range: Range) {
  const today = new Date()
  const from = range === 'year' ? startOfYear(today) : subDays(today, range === '30d' ? 29 : 89)
  return { from: format(from, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
}

const jobStatus = (status: InsightsJobReply['status']) => (status === 'active' ? 'Open' : 'Closed')

const replyColumns: ColumnDef<InsightsJobReply>[] = [
  {
    accessorKey: 'title',
    header: 'Job',
    cell: ({ row }) => (
      <span className="block max-w-[7.5rem] truncate font-medium text-foreground sm:max-w-xs">
        {row.original.title}
      </span>
    ),
  },
  {
    id: 'status',
    accessorFn: (row) => jobStatus(row.status),
    header: 'Status',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ getValue }) => (
      <StatusPill tone={getValue() === 'Open' ? 'success' : 'neutral'}>
        {getValue<string>()}
      </StatusPill>
    ),
  },
  {
    id: 'median_days',
    accessorFn: (row) => row.median_days ?? undefined,
    header: 'Half hear back in',
    sortUndefined: 'last',
    cell: ({ row }) => <span className="tabular-nums">{formatDays(row.original.median_days)}</span>,
  },
  {
    accessorKey: 'waiting',
    header: 'Waiting',
    cell: ({ row }) => (
      <span className={cn('tabular-nums', row.original.waiting > 0 && 'font-medium text-primary')}>
        {row.original.waiting}
      </span>
    ),
  },
  {
    id: 'oldest_waiting_days',
    accessorFn: (row) => row.oldest_waiting_days ?? undefined,
    header: 'Longest wait',
    meta: { className: 'hidden sm:table-cell' },
    sortUndefined: 'last',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatDays(row.original.oldest_waiting_days)}</span>
    ),
  },
  {
    accessorKey: 'replied',
    header: 'Replied',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ row }) => <span className="tabular-nums">{row.original.replied}</span>,
  },
]

function ReplySection({ data, allJobs }: { data: InsightsData; allJobs: boolean }) {
  const waiting = data.replies.reduce((sum, row) => sum + row.waiting, 0)
  return (
    <ChartCard
      title="How fast you reply"
      className="lg:col-span-2"
      headline={
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>
            {data.median_reply_days == null ? (
              'No replies yet.'
            ) : (
              <>
                Half of applicants hear back within{' '}
                <span className="font-heading text-2xl font-light whitespace-nowrap text-foreground tabular-nums">
                  {formatDays(data.median_reply_days)}
                </span>
              </>
            )}
          </p>
          {waiting ? <p>{waiting} waiting for a reply</p> : null}
        </div>
      }
      table={{
        columns: ['Job', 'Half hear back in', 'Waiting', 'Longest wait'],
        rows: data.replies.map((row) => [
          row.title,
          formatDays(row.median_days),
          row.waiting,
          formatDays(row.oldest_waiting_days),
        ]),
      }}
    >
      {allJobs ? (
        <div className="flex flex-col gap-4">
          <ReplyChart replies={data.replies} />
          {data.replies.length > 1 ? (
            <DataTable
              tableId="insights-replies"
              columns={replyColumns}
              data={data.replies}
              getRowId={(row) => row.job_id}
              getRowHref={(row) => `/recruiter/jobs/${row.job_id}`}
              searchPlaceholder="Search jobs"
              filters={[{ column: 'status', title: 'Status' }]}
              pageSizes={[5, 10, 25]}
            />
          ) : null}
        </div>
      ) : null}
    </ChartCard>
  )
}

function InsightsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className={cn('h-72 rounded-xl', i >= 2 && 'lg:col-span-2')} />
      ))}
    </div>
  )
}

export function InsightsView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const range = (RANGES.find((r) => r.value === params.get('range'))?.value ?? '90d') as Range
  const jobId = params.get('job') ?? ALL_JOBS
  const { from, to } = rangeDates(range)

  const query = useGetRecruiterInsightsQuery({
    jobId: jobId === ALL_JOBS ? undefined : jobId,
    from,
    to,
  })
  const data = query.data?.data

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: 'Insights' }]}
        title="Insights"
        facts={data?.total ? [`${data.total.toLocaleString()} applications`] : undefined}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={jobId}
          onValueChange={(value) => setParam('job', value === ALL_JOBS ? null : value)}
        >
          <SelectTrigger className="h-8 w-full rounded-full bg-card sm:w-72" aria-label="Job">
            <SelectValue placeholder="All jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_JOBS}>All jobs</SelectItem>
            {(data?.jobs ?? []).map((job) => (
              <SelectItem key={job.job_id} value={job.job_id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FilterChips
          label="Date range"
          value={range}
          onChange={(value) => setParam('range', value === '90d' ? null : value)}
          options={RANGES}
        />
      </div>

      {query.isLoading ? (
        <InsightsSkeleton />
      ) : query.isError || !data ? (
        <ErrorState onRetry={() => void query.refetch()} retrying={query.isFetching}>
          Couldn&apos;t load insights.
        </ErrorState>
      ) : data.total === 0 ? (
        <EmptyState>No applications in this period.</EmptyState>
      ) : (
        <div
          aria-busy={query.isFetching}
          className={cn(
            'grid gap-4 transition-opacity motion-reduce:transition-none lg:grid-cols-2',
            query.isFetching && 'opacity-60',
          )}
        >
          <ProgressChart progress={data.progress} />
          <SourcesChart sources={data.sources} />
          <WeeklyChart weekly={data.weekly} rangeTo={data.range_to} className="lg:col-span-2" />
          <ReplySection data={data} allJobs={jobId === ALL_JOBS} />
        </div>
      )}
    </PageContainer>
  )
}
