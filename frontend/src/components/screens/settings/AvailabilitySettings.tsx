'use client'

import { type FormEvent, useState } from 'react'

import {
  type Availability,
  WEEKDAYS,
  type Weekday,
  useGetAvailabilityQuery,
  useSaveAvailabilityMutation,
} from '@/lib/api/interviews'
import { notify } from '@/lib/notify'

import { ErrorState } from '@/components/app/Feedback'
import { FormField } from '@/components/app/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

import { SettingsCard } from './SettingsShell'

const DAY_NAME: Record<Weekday, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
}

const LENGTHS = [15, 30, 45, 60, 90]
const BUFFERS = [0, 5, 10, 15, 30]

const ZONE_NAME: Record<string, string> = { 'Asia/Kathmandu': 'Nepal time' }

function AvailabilityForm({ initial }: { initial: Availability }) {
  const [value, setValue] = useState<Availability>(initial)
  const [save, saveState] = useSaveAvailabilityMutation()
  const [error, setError] = useState<string | null>(null)
  const ownLink = value.meeting_link !== 'auto'

  function setDay(day: Weekday, ranges: Availability['days'][Weekday]) {
    setValue((prev) => ({ ...prev, days: { ...prev.days, [day]: ranges } }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const bad = WEEKDAYS.find((day) => value.days[day].some((r) => !r.start || r.start >= r.end))
    if (bad) {
      setError(`${DAY_NAME[bad]}: the end time must be after the start time.`)
      return
    }
    if (ownLink && !/^https?:\/\/\S+$/i.test(value.meeting_link)) {
      setError('Paste the full meeting link, starting with https://')
      return
    }
    setError(null)
    try {
      await save(value).unwrap()
      notify.success('Availability saved')
    } catch {
      notify.error("Couldn't save. Try again.")
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-8">
      <SettingsCard title={`Hours · ${ZONE_NAME[value.timezone] ?? value.timezone}`}>
        <ul className="flex flex-col divide-y">
          {WEEKDAYS.map((day) => {
            const range = value.days[day][0]
            return (
              <li key={day} className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-2">
                <div className="flex w-full items-center gap-3 sm:w-36">
                  <Switch
                    id={`day-${day}`}
                    checked={!!range}
                    onCheckedChange={(on) =>
                      setDay(day, on ? [{ start: '09:00', end: '17:00' }] : [])
                    }
                  />
                  <Label htmlFor={`day-${day}`} className="font-normal text-foreground">
                    {DAY_NAME[day]}
                  </Label>
                </div>
                {range ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                    <Input
                      type="time"
                      aria-label={`${DAY_NAME[day]} from`}
                      value={range.start}
                      onChange={(event) => setDay(day, [{ ...range, start: event.target.value }])}
                      className="min-w-0 flex-1 sm:w-32 sm:flex-none"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      aria-label={`${DAY_NAME[day]} until`}
                      value={range.end}
                      onChange={(event) => setDay(day, [{ ...range, end: event.target.value }])}
                      className="min-w-0 flex-1 sm:w-32 sm:flex-none"
                    />
                  </div>
                ) : (
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    Not available
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </SettingsCard>

      <SettingsCard title="Interviews">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="length" label="Length">
            <Select
              value={String(value.length_minutes)}
              onValueChange={(v) => setValue((prev) => ({ ...prev, length_minutes: Number(v) }))}
            >
              <SelectTrigger id="length" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTHS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="buffer" label="Break between interviews">
            <Select
              value={String(value.buffer_minutes)}
              onValueChange={(v) => setValue((prev) => ({ ...prev, buffer_minutes: Number(v) }))}
            >
              <SelectTrigger id="buffer" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUFFERS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m ? `${m} minutes` : 'No break'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-medium text-foreground">Meeting link</legend>
          <RadioGroup
            value={ownLink ? 'own' : 'auto'}
            onValueChange={(v) =>
              setValue((prev) => ({ ...prev, meeting_link: v === 'auto' ? 'auto' : '' }))
            }
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem id="link-auto" value="auto" />
              <Label htmlFor="link-auto" className="font-normal text-foreground">
                A new video link for each interview
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem id="link-own" value="own" />
              <Label htmlFor="link-own" className="font-normal text-foreground">
                Always use my link
              </Label>
            </div>
          </RadioGroup>
          {ownLink ? (
            <Input
              type="url"
              aria-label="Your meeting link"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={value.meeting_link}
              onChange={(event) =>
                setValue((prev) => ({ ...prev, meeting_link: event.target.value }))
              }
            />
          ) : null}
        </fieldset>
      </SettingsCard>

      <div className="flex flex-col items-end gap-2">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={saveState.isLoading}>
          Save availability
        </Button>
      </div>
    </form>
  )
}

/** When candidates can book interviews with you, how long they are, and where they happen. */
export function AvailabilitySettings() {
  const { data, isLoading, isError, isFetching, refetch } = useGetAvailabilityQuery()
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-6" aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-9 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        ))}
      </div>
    )
  }
  if (isError || !data) {
    return (
      <ErrorState onRetry={() => void refetch()} retrying={isFetching}>
        Couldn&apos;t load your availability.
      </ErrorState>
    )
  }
  return <AvailabilityForm initial={data} />
}
