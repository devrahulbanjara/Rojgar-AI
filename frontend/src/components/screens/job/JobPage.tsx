'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  type Candidate,
  type CountedStage,
  type DecisionAction,
  type PipelineItem,
  type PipelineSort,
  STAGE_LABEL,
  actionsFor,
  jobFacts,
  useGetJobQuery,
  useGetPipelineQuery,
} from '@/lib/api/recruiter'
import { closingLabel } from '@/lib/dates'
import { cn } from '@/lib/utils'

import { PageContainer } from '@/components/app/AppShell'
import { BulkBar } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { FilterChips } from '@/components/app/FilterChips'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusPill } from '@/components/app/StatusPill'
import { EditIcon, PlusIcon, ShareIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AddCandidateDialog } from './AddCandidateDialog'
import { CandidateCard } from './CandidateCard'
import { CandidatePanel } from './CandidatePanel'
import { GetApplicantsSheet } from './GetApplicantsSheet'
import { InviteDialog, type InviteRecipient } from './InviteDialog'
import { JobMoreMenu } from './JobMoreMenu'
import { JobPageSkeleton, PipelineSkeleton } from './skeletons'
import { useDecisions } from './useDecisions'

const STAGES: CountedStage[] = ['new', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']
/** Old links (Today, Jobs table) still use the 8-status names. */
const LEGACY_STAGE: Record<string, CountedStage> = {
  applied: 'new',
  shortlist: 'shortlisted',
  interview_booked: 'interview',
  interview_completed: 'interview',
  offer_accepted: 'hired',
}

const EMPTY_STAGE: Record<CountedStage, string> = {
  new: 'No new applicants.',
  shortlisted: 'No one shortlisted yet.',
  interview: 'No one at interview yet.',
  offer: 'No offers yet.',
  hired: 'No one hired yet.',
  rejected: 'No one here.',
}

function useIsWide() {
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return wide
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return (
    el.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
    !!el.closest('[role="dialog"],[role="menu"],[role="listbox"]')
  )
}

type Invite = { ids: string[]; recipients: InviteRecipient[] }

export function JobPage({ jobId }: { jobId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const wide = useIsWide()

  const rawStage = params.get('stage') ?? 'new'
  const stage: CountedStage =
    LEGACY_STAGE[rawStage] ??
    (STAGES.includes(rawStage as CountedStage) ? (rawStage as CountedStage) : 'new')
  const sort: PipelineSort = params.get('sort') === 'newest' ? 'newest' : 'best_fit'
  const activeId = params.get('app')

  const job = useGetJobQuery(jobId)
  const pipeline = useGetPipelineQuery({ jobId, stage, sort }, { refetchOnMountOrArgChange: 30 })
  const items = useMemo(() => pipeline.data?.items ?? [], [pipeline.data])
  const counts = pipeline.data?.counts

  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [invite, setInvite] = useState<Invite | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const decideNow = useDecisions(jobId)

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
    },
    [params, pathname, router],
  )

  const hrefFor = useCallback(
    (applicationId: string) => {
      const next = new URLSearchParams(params.toString())
      next.set('app', applicationId)
      return `${pathname}?${next}`
    },
    [params, pathname],
  )

  // Wide screens always show someone: open the first candidate.
  useEffect(() => {
    if (!wide || activeId || !items.length) return
    setParams({ app: items[0].application_id })
  }, [wide, activeId, items, setParams])

  // Phones: opening a candidate starts at the top of their page.
  useEffect(() => {
    if (!wide && activeId) window.scrollTo({ top: 0 })
  }, [wide, activeId])

  const nextAfter = useCallback(
    (ids: string[]) => {
      const index = items.findIndex((i) => i.application_id === activeId)
      if (index < 0) return null
      const decided = new Set(ids)
      const after = items.slice(index + 1).find((i) => !decided.has(i.application_id))
      const before = [...items.slice(0, index)]
        .reverse()
        .find((i) => !decided.has(i.application_id))
      return (after ?? before)?.application_id ?? null
    },
    [activeId, items],
  )

  const run = useCallback(
    (ids: string[], action: DecisionAction, people: InviteRecipient[]) => {
      if (activeId && ids.includes(activeId)) setParams({ app: wide ? nextAfter(ids) : null })
      setSelected(new Set())
      void decideNow(ids, action, people.length === 1 ? people[0].name : `${people.length} people`)
    },
    [activeId, decideNow, nextAfter, setParams, wide],
  )

  const request = useCallback(
    (ids: string[], action: DecisionAction, people: InviteRecipient[]) => {
      if (action === 'shortlist') setInvite({ ids, recipients: people })
      else run(ids, action, people)
    },
    [run, setInvite],
  )

  const fromItem = (item: PipelineItem): InviteRecipient => ({
    name: item.person.name,
    email: item.person.email,
  })
  const fromCandidate = (c: Candidate): InviteRecipient => ({
    name: c.person.name,
    email: c.person.email,
  })

  // Keyboard: J/K move, S shortlist, N or R not now, X select.
  const keyState = useRef({ items, activeId, request, setParams, selected })
  useEffect(() => {
    keyState.current = { items, activeId, request, setParams, selected }
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      const { items, activeId, request, setParams } = keyState.current
      const index = items.findIndex((i) => i.application_id === activeId)
      const item = index >= 0 ? items[index] : null
      const key = event.key.toLowerCase()
      if (key === 'j' || key === 'arrowdown' || key === 'k' || key === 'arrowup') {
        if (!items.length) return
        event.preventDefault()
        const step = key === 'j' || key === 'arrowdown' ? 1 : -1
        const next = items[Math.min(items.length - 1, Math.max(0, index + step))]
        setParams({ app: next.application_id })
        document
          .querySelector(`[data-app="${next.application_id}"]`)
          ?.scrollIntoView({ block: 'nearest' })
        return
      }
      if (!item) return
      const { primary, more } = actionsFor(item.stage)
      const allowed = [...primary, ...more]
      if (key === 's' && allowed.includes('shortlist')) {
        event.preventDefault()
        request([item.application_id], 'shortlist', [fromItem(item)])
      } else if ((key === 'n' || key === 'r') && allowed.includes('reject')) {
        event.preventDefault()
        request([item.application_id], 'reject', [fromItem(item)])
      } else if (key === 'x') {
        event.preventDefault()
        setSelected((previous) => {
          const next = new Set(previous)
          if (next.has(item.application_id)) next.delete(item.application_id)
          else next.add(item.application_id)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (job.isLoading) return <JobPageSkeleton />
  if (job.isError || !job.data) {
    return (
      <PageContainer>
        <ErrorState onRetry={() => void job.refetch()} retrying={job.isFetching}>
          Couldn&apos;t load this job.
        </ErrorState>
      </PageContainer>
    )
  }

  const data = job.data
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0
  const waiting = counts ? counts.new + counts.shortlisted + counts.interview : 0
  const selectedItems = items.filter((i) => selected.has(i.application_id))
  const bulk = actionsFor(stage)
  const statusPill =
    data.status === 'open' ? (
      <StatusPill tone="success">Open</StatusPill>
    ) : data.status === 'draft' ? (
      <StatusPill tone="warning">Draft</StatusPill>
    ) : (
      <StatusPill tone="neutral">{data.closed_reason === 'hired' ? 'Filled' : 'Closed'}</StatusPill>
    )

  const getApplicants = (
    <Button variant={total ? 'outline' : 'primary'} onClick={() => setSheetOpen(true)}>
      <ShareIcon />
      Get applicants
    </Button>
  )

  return (
    <PageContainer className="max-w-7xl gap-6">
      <div className={cn('flex flex-col gap-6', activeId && 'hidden lg:flex')}>
        <PageHeader
          breadcrumb={[{ label: 'Jobs', href: '/recruiter/jobs' }, { label: data.title }]}
          title={data.title}
          status={statusPill}
          facts={[...jobFacts(data), data.status === 'open' ? closingLabel(data.closes_at) : null]}
          secondaryAction={
            data.status === 'draft' ? null : (
              <Button asChild variant="outline">
                <Link href={`/recruiter/jobs/${jobId}/edit`}>
                  <EditIcon />
                  Edit
                </Link>
              </Button>
            )
          }
          primaryAction={
            <div className="flex items-center gap-2">
              {data.status === 'open' ? getApplicants : null}
              {data.status === 'draft' ? (
                <Button asChild>
                  <Link href={`/recruiter/jobs/${jobId}/edit`}>Finish and publish</Link>
                </Button>
              ) : null}
              <JobMoreMenu job={data} waiting={waiting} />
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <FilterChips<CountedStage>
            label="Stage"
            value={stage}
            onChange={(value) => {
              setSelected(new Set())
              setParams({ stage: value, app: null })
            }}
            options={STAGES.map((value) => ({
              value,
              label: STAGE_LABEL[value],
              count: counts?.[value],
            }))}
          />
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <Select
              value={sort}
              onValueChange={(value) => setParams({ sort: value === 'newest' ? 'newest' : null })}
            >
              <SelectTrigger size="sm" className="rounded-full bg-card" aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="best_fit">Best fit first</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto sm:ml-0"
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon />
              Add candidate
            </Button>
          </div>
        </div>
      </div>

      {pipeline.isLoading ? (
        <PipelineSkeleton />
      ) : pipeline.isError ? (
        <ErrorState onRetry={() => void pipeline.refetch()} retrying={pipeline.isFetching}>
          Couldn&apos;t load applicants.
        </ErrorState>
      ) : total === 0 ? (
        <EmptyState action={data.status === 'open' ? getApplicants : undefined}>
          No applicants yet.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr] lg:items-start">
          <div
            className={cn(
              'flex flex-col gap-2 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1',
              activeId && 'hidden lg:flex',
            )}
          >
            {selectedItems.length ? (
              <BulkBar count={selectedItems.length}>
                {bulk.primary.includes('shortlist') ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      request(
                        selectedItems.map((i) => i.application_id),
                        'shortlist',
                        selectedItems.map(fromItem),
                      )
                    }
                  >
                    Shortlist {selectedItems.length}
                  </Button>
                ) : null}
                {[...bulk.primary, ...bulk.more].includes('reject') ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      request(
                        selectedItems.map((i) => i.application_id),
                        'reject',
                        selectedItems.map(fromItem),
                      )
                    }
                  >
                    Not now {selectedItems.length}
                  </Button>
                ) : null}
              </BulkBar>
            ) : null}
            {items.length ? (
              <ul className="flex flex-col gap-3 lg:gap-1">
                {items.map((item) => (
                  <CandidateCard
                    key={item.application_id}
                    item={item}
                    href={hrefFor(item.application_id)}
                    active={item.application_id === activeId}
                    selected={selected.has(item.application_id)}
                    onSelectChange={(value) =>
                      setSelected((previous) => {
                        const next = new Set(previous)
                        if (value) next.add(item.application_id)
                        else next.delete(item.application_id)
                        return next
                      })
                    }
                    onDecide={(action) => request([item.application_id], action, [fromItem(item)])}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState>{EMPTY_STAGE[stage]}</EmptyState>
            )}
            {items.length ? (
              <p className="hidden px-3 pt-2 text-xs text-muted-foreground lg:block">
                J/K move · S shortlist · N not now · X select
              </p>
            ) : null}
          </div>

          <div className={cn('min-w-0', !activeId && 'hidden lg:block')}>
            {activeId ? (
              <CandidatePanel
                key={activeId}
                applicationId={activeId}
                onBack={() => setParams({ app: null })}
                onDecide={(candidate, action) =>
                  request([candidate.application_id], action, [fromCandidate(candidate)])
                }
              />
            ) : items.length ? null : (
              <EmptyState>Pick a stage with people in it.</EmptyState>
            )}
          </div>
        </div>
      )}

      <InviteDialog
        open={!!invite}
        onOpenChange={(open) => !open && setInvite(null)}
        recipients={invite?.recipients ?? []}
        jobTitle={data.title}
        companyName={data.company_name}
        onSend={() => {
          if (invite) run(invite.ids, 'shortlist', invite.recipients)
          setInvite(null)
        }}
      />
      <GetApplicantsSheet job={data} open={sheetOpen} onOpenChange={setSheetOpen} />
      <AddCandidateDialog jobId={jobId} open={addOpen} onOpenChange={setAddOpen} />
    </PageContainer>
  )
}
