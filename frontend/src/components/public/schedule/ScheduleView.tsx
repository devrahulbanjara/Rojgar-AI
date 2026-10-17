'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { type Dict, formatDateTime, formatDay, formatTime } from '@/lib/i18n'
import { useLocale, useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'
import {
  type BookedInterview,
  type InterviewInfo,
  PublicApiError,
  type PublicSchedule,
  publicApi,
} from '@/lib/publicApi'
import { cn } from '@/lib/utils'

import { VideoIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { AuthCard } from '../auth/AuthCard'
import { AddToCalendar } from '../status/StageBits'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: PublicSchedule }

const isUrl = (value: string) => /^https?:\/\//i.test(value)

const asInterviewInfo = (booked: BookedInterview): InterviewInfo => ({
  starts_at: booked.start,
  ends_at: booked.end,
  join_url: isUrl(booked.meeting_link) ? booked.meeting_link : null,
  location: isUrl(booked.meeting_link) ? null : booked.meeting_link || null,
})

async function fetchSchedule(token: string, t: Dict): Promise<State> {
  try {
    return { kind: 'ready', data: await publicApi.schedule(token) }
  } catch (err) {
    const status = err instanceof PublicApiError ? err.status : 0
    const message =
      status === 404 || status === 422
        ? t.schedule.invalid
        : status === 410
          ? t.schedule.closed
          : t.common.error
    return { kind: 'error', message }
  }
}

/** The interview link from the invite email: pick a time, then change or cancel it. */
export function ScheduleView({ token }: { token: string }) {
  const t = useT()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchSchedule(token, t).then((next) => !cancelled && setState(next))
    return () => {
      cancelled = true
    }
  }, [token, t])

  const reload = useCallback(async () => setState(await fetchSchedule(token, t)), [token, t])

  if (state.kind === 'loading') {
    return (
      <AuthCard title={t.schedule.title}>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
      </AuthCard>
    )
  }

  if (state.kind === 'error') {
    return (
      <AuthCard title={t.schedule.title}>
        <p className="text-sm text-foreground">{state.message}</p>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/me/applications">{t.system.myApplications}</Link>
        </Button>
      </AuthCard>
    )
  }

  return <Schedule token={token} data={state.data} reload={reload} />
}

function Schedule({
  token,
  data,
  reload,
}: {
  token: string
  data: PublicSchedule
  reload: () => Promise<void>
}) {
  const t = useT()
  const zone = data.timezone
  const [changing, setChanging] = useState(false)
  const [busy, setBusy] = useState(false)
  const booked = data.interview

  async function pick(start: string) {
    setBusy(true)
    try {
      if (booked) {
        await publicApi.reschedule(token, start)
        notify.success(t.schedule.moved)
      } else {
        await publicApi.book(token, start)
        notify.success(t.schedule.booked)
      }
      setChanging(false)
      await reload()
    } catch (err) {
      if (err instanceof PublicApiError && err.status === 409) {
        notify.error(t.schedule.taken)
        await reload()
      } else {
        notify.error(err instanceof Error ? err.message : t.common.error)
      }
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setBusy(true)
    try {
      await publicApi.cancelInterview(token)
      notify.success(t.schedule.cancelled)
      await reload()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t.common.error)
    } finally {
      setBusy(false)
    }
  }

  // Chrome still reports the old spelling "Asia/Katmandu".
  const sameZone = (a: string, b: string) =>
    a.replace('Katmandu', 'Kathmandu') === b.replace('Katmandu', 'Kathmandu')
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <AuthCard title={data.job_title}>
      <div className="-mt-3 flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{data.company_name}</p>
        <p className="text-sm text-muted-foreground">
          {t.schedule.with(data.interview_minutes, data.interviewer_name)}
        </p>
      </div>

      {booked && !changing ? (
        <Booked
          booked={booked}
          zone={zone}
          title={`${data.job_title} · ${data.company_name}`}
          busy={busy}
          onChange={() => setChanging(true)}
          onCancel={cancel}
        />
      ) : (
        <TimePicker
          key={booked?.start ?? 'new'}
          slots={data.slots}
          zone={zone}
          busy={busy}
          onPick={pick}
          onKeep={booked ? () => setChanging(false) : undefined}
        />
      )}

      {!sameZone(browserZone, zone) ? (
        <p className="text-xs text-muted-foreground">{t.schedule.zone(zone)}</p>
      ) : null}
    </AuthCard>
  )
}

function Booked({
  booked,
  zone,
  title,
  busy,
  onChange,
  onCancel,
}: {
  booked: BookedInterview
  zone: string
  title: string
  busy: boolean
  onChange: () => void
  onCancel: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const info = asInterviewInfo(booked)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <div>
          <p className="text-xs text-muted-foreground">{t.schedule.booked}</p>
          <p className="font-heading text-lg font-semibold text-foreground">
            {formatDay(booked.start, locale, zone)}
          </p>
          <p className="text-base text-foreground">
            {formatTime(booked.start, locale, zone)} – {formatTime(booked.end, locale, zone)}
          </p>
          {info.location ? (
            <p className="mt-1 text-sm text-muted-foreground">{info.location}</p>
          ) : null}
        </div>
        {info.join_url ? (
          <Button asChild size="lg" className="w-full">
            <a href={info.join_url} target="_blank" rel="noopener noreferrer">
              <VideoIcon />
              {t.status.join}
            </a>
          </Button>
        ) : null}
        <AddToCalendar title={title} interview={info} className="w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="lg" className="w-full" onClick={onChange} disabled={busy}>
          {t.schedule.change}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-muted-foreground" disabled={busy}>
              {t.schedule.cancel}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t.schedule.cancelConfirm}</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t.schedule.keep}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={onCancel}>
                  {t.schedule.cancel}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function TimePicker({
  slots,
  zone,
  busy,
  onPick,
  onKeep,
}: {
  slots: PublicSchedule['slots']
  zone: string
  busy: boolean
  onPick: (start: string) => void
  /** While changing a booked time: go back without changing it. */
  onKeep?: () => void
}) {
  const t = useT()
  const locale = useLocale()
  const days = useMemo(() => {
    const map = new Map<string, PublicSchedule['slots']>()
    for (const slot of slots) {
      const day = formatDay(slot.start, locale, zone)
      map.set(day, [...(map.get(day) ?? []), slot])
    }
    return [...map.entries()]
  }, [slots, locale, zone])
  const [day, setDay] = useState(0)
  const [start, setStart] = useState<string | null>(null)

  if (!days.length) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground">{t.schedule.noSlots}</p>
        {onKeep ? (
          <Button variant="outline" size="lg" className="w-full" onClick={onKeep}>
            {t.schedule.keepTime}
          </Button>
        ) : null}
      </div>
    )
  }

  const current = days[Math.min(day, days.length - 1)]

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-base font-semibold text-foreground">
        {t.schedule.pickTime}
      </h2>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:-mx-8 sm:px-8">
        {days.map(([label], index) => (
          <Button
            key={label}
            size="md"
            variant={index === day ? 'primary' : 'outline'}
            aria-pressed={index === day}
            className="shrink-0"
            onClick={() => {
              setDay(index)
              setStart(null)
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {current[1].map((slot) => (
          <Button
            key={slot.start}
            size="lg"
            variant="outline"
            aria-pressed={start === slot.start}
            className={cn(
              'px-2',
              start === slot.start && 'border-primary bg-primary/5 text-primary hover:bg-primary/10',
            )}
            onClick={() => setStart(slot.start)}
          >
            {formatTime(slot.start, locale, zone)}
          </Button>
        ))}
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={!start}
        loading={busy}
        onClick={() => start && onPick(start)}
      >
        {start ? t.schedule.book(formatDateTime(start, locale, zone)) : t.schedule.bookEmpty}
      </Button>
      {onKeep ? (
        <Button variant="ghost" className="w-full" onClick={onKeep} disabled={busy}>
          {t.schedule.keepTime}
        </Button>
      ) : null}
    </div>
  )
}
