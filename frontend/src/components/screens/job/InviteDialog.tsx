'use client'

import { useState } from 'react'

import { CAPABILITIES } from '@/lib/api/recruiter'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export type InviteRecipient = { name: string; email: string | null }

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

/** Shortlist → the invite the candidate will get. Send is the default (Enter). */
export function InviteDialog({
  open,
  onOpenChange,
  recipients,
  jobTitle,
  companyName,
  onSend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipients: InviteRecipient[]
  jobTitle: string
  companyName: string
  onSend: (message: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const single = recipients.length === 1 ? recipients[0] : null
  const greeting = single ? `Hi ${firstName(single.name)},` : 'Hi {first name},'
  const defaultBody = `${greeting}\n\nGood news: ${companyName || 'we'} shortlisted you for ${jobTitle}. Open your application to see the next step.`
  const [body, setBody] = useState(defaultBody)
  const noEmail = recipients.filter((r) => !r.email)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setEditing(false)
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {single ? `Invite ${single.name}` : `Invite ${recipients.length} people`}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            To:{' '}
            <span className="text-foreground">
              {single ? (single.email ?? 'no email') : `${recipients.length} people`}
            </span>
          </p>
          <p className="text-muted-foreground">
            Subject:{' '}
            <span className="text-foreground">You&apos;ve been shortlisted for {jobTitle}</span>
          </p>
          {editing ? (
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              aria-label="Invite message"
              autoFocus
            />
          ) : (
            <div className="rounded-xl border bg-muted/40 p-4 whitespace-pre-line">
              {defaultBody}
              <p className="mt-3 font-medium text-primary">View your application</p>
            </div>
          )}
          {noEmail.length ? (
            <p className="text-xs text-warning">
              {noEmail.length === 1 && single
                ? `${firstName(single.name)} has no email. Call or Viber them too.`
                : `${noEmail.length} have no email. Call or Viber them too.`}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          {CAPABILITIES.editInviteEmail && !editing ? (
            <Button
              variant="outline"
              onClick={() => {
                setBody(defaultBody)
                setEditing(true)
              }}
            >
              Edit
            </Button>
          ) : null}
          <Button
            autoFocus={!editing}
            onClick={() => {
              onSend(editing && body !== defaultBody ? body : null)
              setEditing(false)
            }}
          >
            {single ? 'Send invite' : `Send ${recipients.length} invites`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
