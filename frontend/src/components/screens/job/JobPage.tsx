'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import {
  type DecideAction,
  type CandidatePanel as Panel,
  type PipelineItem,
  type PipelineSort,
  STAGE_LABEL,
  type Stage,
  recruiterApi,
  useGetPipelineQuery,
} from '@/lib/api/recruiter'
import { closingLabel } from '@/lib/dates'
import { jobFacts } from '@/lib/jobHelpers'
import { cn } from '@/lib/utils'
import { useGetJobQuery } from '@/store/services/jobsApi'

import { AiText } from '@/components/app/Ai'
import { PageContainer } from '@/components/app/AppShell'
import { BulkBar } from '@/components/app/DataTable'
import { EmptyState } from '@/components/app/EmptyState'
import { ErrorState } from '@/components/app/Feedback'
import { FilterChips } from '@/components/app/FilterChips'
import { Hint } from '@/components/app/Hint'
import { PageHeader } from '@/components/app/PageHeader'
import { JobStatusPill } from '@/components/app/StatusPill'
import { EditIcon, KeyboardIcon, PlusIcon, ShareIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
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
import { cardActions } from './DecisionButtons'
import { GetApplicantsSheet } from './GetApplicantsSheet'
import { InviteDialog, type InviteRecipient } from './InviteDialog'
import { JobMoreMenu } from './JobMoreMenu'
import { JobPageSkeleton, ListSkeleton, PipelineSkeleton } from './skeletons'
import { useDecisions } from './useDecisions'

const STAGES: Stage[] = [
  'new',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
]

const EMPTY_STAGE: Record<Stage, string> = {
  new: 'No new applicants.',
  shortlisted: 'No one shortlisted yet.',
  interview: 'No one at interview yet.',
  offer: 'No offers yet.',
  hired: 'No one hired yet.',
  rejected: 'No one here.',
  withdrawn: 'No one here.',
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
  const pathname = usePathname()
  const params = useSearchParams()
  const wide = useIsWide()

  const rawStage = params.get('stage') ?? 'new'
  // Anything unknown (old links said "applied") opens New.
  const stage: Stage = STAGES.includes(rawStage as Stage) ? (rawStage as Stage) : 'new'
  const sort: PipelineSort = params.get('sort') === 'newest' ? 'newest' : 'best_fit'
  const activeId = params.get('app')

  const job = useGetJobQuery(jobId)
  const args = { jobId, stage, sort }
  // While CVs are being read, check back every few seconds.
  const reviewingBefore = recruiterApi.endpoints.getPipeline.useQueryState(args).data?.reviewing
  const pipeline = useGetPipelineQuery(args, {
    refetchOnMountOrArgChange: 30,
    pollingInterval: reviewingBefore ? 5000 : 0,
  })
  // currentData, not data: data still holds the previous tab while the next one loads.
  const items = useMemo(() => pipeline.currentData?.items ?? [], [pipeline.currentData])
  const switching = !pipeline.currentData && pipeline.isFetching
  const counts = pipeline.data?.counts
  const reviewing = pipeline.data?.reviewing ?? 0

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
      // Native history keeps J/K instant: no server round trip per candidate.
      window.history.replaceState(null, '', `${pathname}${next.size ? `?${next}` : ''}`)
    },
    [params, pathname],
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
    (ids: string[], action: DecideAction, people: InviteRecipient[]) => {
      if (activeId && ids.includes(activeId)) setParams({ app: wide ? nextAfter(ids) : null })
      setSelected(new Set())
      void decideNow(ids, action, people.length === 1 ? people[0].name : `${people.length} people`)
    },
    [activeId, decideNow, nextAfter, setParams, wide],
  )

  const request = useCallback(
    (ids: string[], action: DecideAction, people: InviteRecipient[]) => {
      if (action === 'shortlist') setInvite({ ids, recipients: people })
      else run(ids, action, people)
    },
    [run, setInvite],
  )

  const fromItem = (item: PipelineItem): InviteRecipient => ({
    name: item.name,
    email: item.email,
  })
  const fromCandidate = (c: Panel): InviteRecipient => ({
    name: c.person.name,
    email: c.person.email,
  })

  // Keyboard: J/K move, S shortlist, R reject, X select.
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
      const allowed = cardActions(item.stage)
      if (key === 's' && allowed.includes('shortlist')) {
        event.preventDefault()
        request([item.application_id], 'shortlist', [fromItem(item)])
      } else if (key === 'r' && allowed.includes('reject')) {
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
  const bulk = cardActions(stage)
  const stages = STAGES.filter((s) => s !== 'withdrawn' || counts?.withdrawn || stage === s)

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
          status={<JobStatusPill job={data} />}
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

        {pipeline.isLoading || total > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <FilterChips<Stage>
              label="Stage"
              value={stage}
              onChange={(value) => {
                setSelected(new Set())
                setParams({ stage: value, app: null })
              }}
              options={stages.map((value) => ({
                value,
                label: STAGE_LABEL[value],
                count: counts?.[value],
              }))}
            />
            {reviewing ? (
              <AiText className="text-sm">
                Reading {reviewing} CV{reviewing === 1 ? '' : 's'}…
              </AiText>
            ) : null}
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
              <Hint label="Keys: J / K next and previous · S shortlist · R reject · X select">
                <IconButton
                  label="Keyboard shortcuts"
                  size="sm"
                  className="hidden text-muted-foreground lg:inline-flex"
                >
                  <KeyboardIcon />
                </IconButton>
              </Hint>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto sm:ml-0"
                onClick={() => setAddOpen(true)}
              >
                <PlusIcon />
                Add applicant
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {pipeline.isLoading ? (
        <PipelineSkeleton />
      ) : pipeline.isError ? (
        <ErrorState onRetry={() => void pipeline.refetch()} retrying={pipeline.isFetching}>
          Couldn&apos;t load applicants.
        </ErrorState>
      ) : total === 0 ? (
        <EmptyState
          action={
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <PlusIcon />
              Add applicant
            </Button>
          }
        >
          No applicants yet.
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[minmax(300px,380px)_1fr] lg:items-start">
          <div
            className={cn(
              'flex flex-col gap-2 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]',
              activeId && 'hidden lg:flex',
            )}
          >
            {selectedItems.length ? (
              <BulkBar count={selectedItems.length}>
                {bulk.includes('shortlist') ? (
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
                {bulk.includes('reject') ? (
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
                    Reject {selectedItems.length}
                  </Button>
                ) : null}
              </BulkBar>
            ) : null}
            {switching ? (
              <ListSkeleton />
            ) : items.length ? (
              <ul className="-mx-1 flex flex-col gap-3 px-1 lg:min-h-0 lg:gap-1 lg:overflow-y-auto">
                {items.map((item) => (
                  <CandidateCard
                    key={item.application_id}
                    item={item}
                    href={hrefFor(item.application_id)}
                    onOpen={() => setParams({ app: item.application_id })}
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
        companyName={data.company.name}
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
