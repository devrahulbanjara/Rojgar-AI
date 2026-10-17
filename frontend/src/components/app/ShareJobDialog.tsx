'use client'

import { useRef } from 'react'

import { notify } from '@/lib/notify'
import { type ShareableJob, applyUrl, facebookPost, linkedInPost } from '@/lib/shareLinks'
import { Check, Copy, Download, Share2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

async function copy(text: string, what: string) {
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
      <Button size="sm" variant="outline" onClick={() => void copy(value, what)}>
        <Copy />
        Copy
      </Button>
    </div>
  )
}

export function ShareJobDialog({ job, trigger }: { job: ShareableJob; trigger?: React.ReactNode }) {
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
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" aria-label={`Share ${job.title}`}>
            <Share2 />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {job.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <CopyRow label="Apply link" value={directLink} what="Link" />
          <CopyRow label="LinkedIn post" value={linkedInPost(job)} what="LinkedIn post" />
          <CopyRow label="Facebook post" value={facebookPost(job)} what="Facebook post" />
          <CopyRow
            label="Merojob external link"
            value={applyUrl(job.slug, 'merojob')}
            what="Merojob link"
          />
        </div>

        <Separator />

        <div className="flex items-center gap-4">
          <div className="rounded-lg border bg-white p-2">
            <QRCodeCanvas ref={qrRef} value={directLink} size={112} marginSize={1} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="size-4 text-status-offer-foreground" />
              For posters and job fairs
            </p>
            <Button size="sm" variant="outline" onClick={downloadQr}>
              <Download />
              Download QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
