'use client'

import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * A short message that goes to the business owner (reject, suspend, ask for
 * info). Ready-made lines fill the box in one tap; the text stays editable.
 */
export function ReasonDialog({
  trigger,
  title,
  label,
  suggestions,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  label: string
  suggestions: string[]
  confirmLabel: string
  destructive?: boolean
  /** Resolve to close the dialog; throw to keep it open. */
  onConfirm: (text: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = text.trim().length >= 3

  async function confirm() {
    if (!valid) return
    setBusy(true)
    try {
      await onConfirm(text.trim())
      setOpen(false)
      setText('')
    } catch {
      // The caller showed the error; keep the text so it can be sent again.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((line) => (
            <Button
              key={line}
              size="sm"
              variant="outline"
              className="h-auto max-w-full py-1.5 text-left whitespace-normal"
              onClick={() => setText(line)}
            >
              {line}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason-text">{label}</Label>
          <Textarea
            id="reason-text"
            rows={3}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            disabled={!valid}
            loading={busy}
            onClick={() => void confirm()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
