'use client'

import { useState } from 'react'

import { useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'
import { type ReportReason, publicApi } from '@/lib/publicApi'

import { FlagIcon } from '@/components/icons'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

const REASONS: ReportReason[] = ['fee_requested', 'fake', 'discriminatory', 'other']

/** Quiet "Report this job" link: pick a reason, optionally say what happened. */
export function ReportJob({ slug }: { slug: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    if (!reason) return
    setSending(true)
    try {
      await publicApi.report(slug, { reason, details: details.trim() })
      notify.success(t.report.done)
      setOpen(false)
      setReason(null)
      setDetails('')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t.common.error)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto w-fit px-0 text-muted-foreground">
          <FlagIcon />
          {t.report.link}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.report.link}</DialogTitle>
        </DialogHeader>
        <RadioGroup
          value={reason ?? ''}
          onValueChange={(value) => setReason(value as ReportReason)}
          className="gap-1"
        >
          {REASONS.map((value) => (
            <Label
              key={value}
              htmlFor={`report-${value}`}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm font-normal hover:bg-accent"
            >
              <RadioGroupItem id={`report-${value}`} value={value} />
              {t.report.reasons[value]}
            </Label>
          ))}
        </RadioGroup>
        {reason ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-details">{t.report.details}</Label>
            <Textarea
              id="report-details"
              rows={3}
              maxLength={1000}
              className="text-base"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t.report.cancel}</Button>
          </DialogClose>
          <Button onClick={send} loading={sending} disabled={!reason}>
            {t.report.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
