'use client'

import { useRef } from 'react'

import { notify } from '@/lib/notify'
import { type ShareableJob, applyUrl, facebookPost, linkedInPost } from '@/lib/shareLinks'
import { QRCodeCanvas } from 'qrcode.react'

import { CopyIcon, DownloadIcon, ShareIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    notify.success(`${what} copied`)
  } catch {
    notify.error("Couldn't copy. Select the text and copy it instead.")
  }
}

function CopyRow({ label, value, what }: { label: string; value: string; what: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{value.split('\n')[0]}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => void copyText(value, what)}
      >
        <CopyIcon />
        Copy
      </Button>
    </div>
  )
}

/** The share content: apply link, LinkedIn/Facebook post text, Merojob link, QR. */
export function SharePanel({ job }: { job: ShareableJob }) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const directLink = applyUrl(job.slug, 'direct')

  function downloadQr() {
    const canvas = qrRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${job.title.replace(/[^\w-]+/g, '-').toLowerCase()}-apply-qr.png`
    link.click()
  }

  return (
    // min-w-0: inside a grid (dialog) or flex (sheet) parent, a long link must
    // truncate instead of widening the panel past its container.
    <div className="flex min-w-0 flex-col gap-4">
      <CopyRow label="Apply link" value={directLink} what="Link" />
      <CopyRow label="LinkedIn post" value={linkedInPost(job)} what="LinkedIn post" />
      <CopyRow label="Facebook post" value={facebookPost(job)} what="Facebook post" />
      <CopyRow
        label="Merojob external link"
        value={applyUrl(job.slug, 'merojob')}
        what="Merojob link"
      />

      <Separator />

      <div className="flex items-center gap-4">
        <div className="shrink-0 rounded-lg border bg-white p-2">
          <QRCodeCanvas ref={qrRef} value={directLink} size={112} marginSize={1} />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm text-muted-foreground">For posters and job fairs</p>
          <Button size="sm" variant="outline" onClick={downloadQr}>
            <DownloadIcon />
            Download QR
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Share a job from a button: the same panel in a dialog. */
export function ShareMenu({ job, trigger }: { job: ShareableJob; trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" aria-label={`Share ${job.title}`}>
            <ShareIcon />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">Share {job.title}</DialogTitle>
        </DialogHeader>
        <SharePanel job={job} />
      </DialogContent>
    </Dialog>
  )
}
