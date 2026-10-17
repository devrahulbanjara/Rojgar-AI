'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  type CompanyPerson,
  applicantHref,
  useGetCompanyPeopleQuery,
  useLazySearchPeopleQuery,
} from '@/lib/api/recruiter'
import { ago } from '@/lib/dates'
import type { ColumnDef } from '@tanstack/react-table'

import { Spinner } from '@/components/app/Ai'
import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { FitPill, StagePill } from '@/components/app/StatusPill'
import { SearchIcon } from '@/components/icons'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

type Row = CompanyPerson & { href: string }

const toRow = (c: CompanyPerson): Row => ({
  ...c,
  href: applicantHref(c.primary_job_id, c.latest_application_id, c.latest_stage),
})

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'applicant_name',
    header: ({ column }) => <SortableHeader column={column} label="Person" />,
    cell: ({ row }) => {
      const c = row.original
      return (
        <div className="flex min-w-0 items-center gap-3">
          <EntityAvatar name={c.applicant_name} src={c.applicant_avatar_url} />
          <div className="min-w-0">
            <Link
              href={c.href}
              className="block truncate text-sm font-semibold text-foreground hover:underline"
            >
              {c.applicant_name}
            </Link>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {c.applicant_phone ? (
                <a
                  href={`tel:${c.applicant_phone.replace(/\s+/g, '')}`}
                  className="hover:underline"
                >
                  {c.applicant_phone}
                </a>
              ) : c.applicant_email ? (
                <span className="truncate">{c.applicant_email}</span>
              ) : null}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'primary_job_title',
    meta: { className: 'hidden md:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="Latest job" />,
    cell: ({ row }) => (
      <span className="block max-w-56 truncate text-sm text-foreground">
        {row.original.primary_job_title}
        {row.original.application_count > 1 ? (
          <span className="text-muted-foreground">
            {` · ${row.original.application_count} jobs`}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: 'stage',
    accessorFn: (row) => row.latest_stage,
    header: () => <span className="text-xs font-medium">Stage</span>,
    cell: ({ row }) => <StagePill stage={row.original.latest_stage} />,
  },
  {
    id: 'fit',
    meta: { className: 'hidden sm:table-cell' },
    header: () => <span className="text-xs font-medium">Fit</span>,
    cell: ({ row }) =>
      row.original.latest_fit ? (
        <FitPill fit={row.original.latest_fit} />
      ) : (
        <span className="text-sm text-muted-foreground">Not checked</span>
      ),
  },
  {
    accessorKey: 'last_activity_at',
    meta: { className: 'hidden lg:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="Last activity" />,
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {ago(row.original.last_activity_at)}
      </span>
    ),
  },
]

function CandidatesSkeleton() {
  return (
    <div className="rounded-xl border bg-card" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="hidden h-4 w-48 md:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
        </div>
      ))}
    </div>
  )
}

const ALL = '__all'

/** Everyone who applied to any job: one search box (name, skill or experience) and a job filter. */
export function CandidatesView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const query = params.get('q') ?? ''
  const jobFilter = params.get('job') ?? ALL
  const [text, setText] = useState(query)

  const { data, isLoading, isError, isFetching, refetch } = useGetCompanyPeopleQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const [search, semantic] = useLazySearchPeopleQuery()
  const rows = useMemo(() => (data ?? []).map(toRow), [data])

  // Old links (/recruiter/candidates/{id}) open the applicant on their job page.
  const oldLink = params.get('app')
  useEffect(() => {
    if (!oldLink || !rows.length) return
    const app = rows.flatMap((r) => r.applications).find((a) => a.application_id === oldLink)
    if (app) router.replace(applicantHref(app.job_id, oldLink, app.stage))
  }, [oldLink, rows, router])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  // Type to filter by name, email or job at once; after a pause the same words
  // also search CVs ("used Tally", "ICU nurse", "5 years teaching").
  useEffect(() => {
    const q = text.trim()
    const timer = window.setTimeout(() => {
      if (q !== query) setParam('q', q || null)
      if (q.length >= 3) void search(q, true)
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const jobs = useMemo(() => {
    const byId = new Map<string, string>()
    for (const app of rows.flatMap((r) => r.applications)) byId.set(app.job_id, app.job_title)
    return [...byId].sort((a, b) => a[1].localeCompare(b[1]))
  }, [rows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const inCategory = rows.filter(
      (r) => jobFilter === ALL || r.applications.some((a) => a.job_id === jobFilter),
    )
    if (!q) return inCategory
    const direct = inCategory.filter((r) =>
      [r.applicant_name, r.applicant_email, r.primary_job_title]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    )
    const results =
      semantic.data && semantic.originalArgs === query.trim() ? semantic.data.candidates : []
    const seen = new Set(direct.map((r) => r.candidate_id))
    const byId = new Map(inCategory.map((r) => [r.candidate_id, r]))
    const fromCvs: Row[] = []
    for (const hit of results) {
      const row = byId.get(hit.candidate_id)
      if (row && !seen.has(row.candidate_id)) {
        seen.add(row.candidate_id)
        fromCvs.push(row)
      }
    }
    return [...direct, ...fromCvs]
  }, [rows, jobFilter, query, semantic.data, semantic.originalArgs])

  const searching = semantic.isFetching && query.trim().length >= 3

  return (
    <PageContainer>
      <PageHeader title="Applicants" facts={rows.length ? [`${rows.length} people`] : undefined} />

      {rows.length || isLoading ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Name, skill or experience"
              className="rounded-full bg-card pr-9 pl-9"
              aria-label="Search applicants"
            />
            {searching ? (
              <Spinner
                size="sm"
                label="Searching CVs"
                className="absolute top-1/2 right-3 -translate-y-1/2"
              />
            ) : null}
          </div>
          <Select
            value={jobFilter}
            onValueChange={(value) => setParam('job', value === ALL ? null : value)}
          >
            <SelectTrigger className="w-full rounded-full bg-card sm:w-64" aria-label="Job">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All jobs</SelectItem>
              {jobs.map(([id, title]) => (
                <SelectItem key={id} value={id}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {isLoading ? (
        <CandidatesSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
          Couldn&apos;t load applicants.
        </ErrorState>
      ) : rows.length === 0 ? (
        <EmptyState>No one has applied yet.</EmptyState>
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(row) => row.candidate_id}
          initialSorting={[{ id: 'last_activity_at', desc: true }]}
          emptyText={searching ? 'Searching CVs…' : 'No one matches.'}
          pageSizes={[25, 50, 100]}
        />
      )}
    </PageContainer>
  )
}
