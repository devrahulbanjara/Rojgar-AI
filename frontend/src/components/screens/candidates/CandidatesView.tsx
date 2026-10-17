'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ago } from '@/lib/dates'
import {
  type RecruiterCandidateListItem,
  useGetMyCompanyCandidatesQuery,
  useLazySemanticSearchCandidatesQuery,
} from '@/store/services/applicationsApi'
import type { ColumnDef } from '@tanstack/react-table'

import { Spinner } from '@/components/app/Ai'
import { PageContainer } from '@/components/app/AppShell'
import { DataTable, SortableHeader } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { ErrorState } from '@/components/app/Feedback'
import { PageHeader } from '@/components/app/PageHeader'
import { FitText, StagePill, fitFromScore } from '@/components/app/StatusPill'
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

type Row = RecruiterCandidateListItem & {
  href: string
  category: string
  fit: ReturnType<typeof fitFromScore>
  reviewing: boolean
}

const panelHref = (c: RecruiterCandidateListItem) =>
  `/recruiter/jobs/${c.primary_job_id}?candidate=${c.latest_application_id}`

function toRow(c: RecruiterCandidateListItem): Row {
  const latest =
    c.applications.find((a) => a.application_id === c.latest_application_id) ?? c.applications[0]
  return {
    ...c,
    href: panelHref(c),
    category: c.primary_job_category || c.primary_job_title,
    fit: fitFromScore(latest?.score),
    reviewing: latest?.ai_review_status === 'pending',
  }
}

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
              {c.has_cv_file === false ? <span className="shrink-0">· No CV</span> : null}
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
    accessorFn: (row) => row.latest_status,
    header: () => <span className="text-xs font-medium">Stage</span>,
    cell: ({ row }) => <StagePill status={row.original.latest_status} />,
  },
  {
    id: 'fit',
    meta: { className: 'hidden sm:table-cell' },
    header: () => <span className="text-xs font-medium">Fit</span>,
    cell: ({ row }) =>
      row.original.fit ? (
        <FitText fit={row.original.fit} />
      ) : (
        <span className="text-sm text-muted-foreground">
          {row.original.reviewing ? 'Reviewing' : 'Not reviewed'}
        </span>
      ),
  },
  {
    accessorKey: 'latest_updated_at',
    meta: { className: 'hidden lg:table-cell' },
    header: ({ column }) => <SortableHeader column={column} label="Last activity" />,
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {ago(row.original.latest_updated_at)}
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

/** Everyone who applied to any job: one search box (name, skill or experience) and a category filter. */
export function CandidatesView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? ALL
  const [text, setText] = useState(query)

  const { data, isLoading, isError, isFetching, refetch } = useGetMyCompanyCandidatesQuery(
    { page: 1, size: 200 },
    { refetchOnMountOrArgChange: true },
  )
  const [search, semantic] = useLazySemanticSearchCandidatesQuery()
  const rows = useMemo(() => (data?.data ?? []).map(toRow), [data])

  // Old links (/recruiter/candidates/{id}, /recruiter/talent?app={id}) open the candidate on the job page.
  const legacyApp = params.get('app')
  useEffect(() => {
    if (!legacyApp || !rows.length) return
    const match = rows.find((r) => r.applications.some((a) => a.application_id === legacyApp))
    if (match) {
      const app = match.applications.find((a) => a.application_id === legacyApp)!
      router.replace(`/recruiter/jobs/${app.job_id}?candidate=${legacyApp}`)
    }
  }, [legacyApp, rows, router])

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
      if (q.length >= 3) void search({ q, size: 50 }, true)
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))].sort((a, b) => a.localeCompare(b)),
    [rows],
  )
  const hasCategories = rows.some((r) => r.primary_job_category)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const inCategory = rows.filter((r) => category === ALL || r.category === category)
    if (!q) return inCategory
    const direct = inCategory.filter((r) =>
      [r.applicant_name, r.applicant_email, r.primary_job_title]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    )
    const results =
      semantic.data && semantic.originalArgs?.q === query.trim()
        ? semantic.data.data.candidates
        : []
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
  }, [rows, category, query, semantic.data, semantic.originalArgs])

  const searching = semantic.isFetching && query.trim().length >= 3

  return (
    <PageContainer>
      <PageHeader title="Candidates" facts={rows.length ? [`${rows.length} people`] : undefined} />

      {rows.length || isLoading ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Name, skill or experience"
              className="rounded-full bg-card pr-9 pl-9"
              aria-label="Search candidates"
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
            value={category}
            onValueChange={(value) => setParam('category', value === ALL ? null : value)}
          >
            <SelectTrigger
              className="w-full rounded-full bg-card sm:w-56"
              aria-label={hasCategories ? 'Category' : 'Job'}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{hasCategories ? 'All categories' : 'All jobs'}</SelectItem>
              {categories.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
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
          Couldn&apos;t load candidates.
        </ErrorState>
      ) : rows.length === 0 ? (
        <EmptyState>No one has applied yet.</EmptyState>
      ) : (
        <DataTable
          columns={columns}
          data={visible}
          getRowId={(row) => row.candidate_id}
          initialSorting={[{ id: 'latest_updated_at', desc: true }]}
          emptyText={searching ? 'Searching CVs…' : 'No one matches.'}
          pageSizes={[25, 50, 100]}
        />
      )}
    </PageContainer>
  )
}
