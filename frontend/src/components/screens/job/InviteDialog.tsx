'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type InviteRecipient = { name: string; email: string | null }

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

/** Shortlist → a preview of the email they will get (outline of the backend "shortlist" template). */
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
  onSend: () => void
}) {
  const single = recipients.length === 1 ? recipients[0] : null
  const noEmail = recipients.filter((r) => !r.email)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {single ? `Shortlist ${single.name}` : `Shortlist ${recipients.length} people`}
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
            <span className="text-foreground">
              You&apos;re shortlisted for {jobTitle} at {companyName}
            </span>
          </p>
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
            <p>Hi {single ? firstName(single.name) : '{first name}'},</p>
            <p>
              Thanks for applying to <strong>{jobTitle}</strong> at {companyName}. We&apos;d like to
              move forward with your application.
            </p>
            <p>We will contact you soon about the next step.</p>
            <p className="font-medium text-primary">See your application</p>
          </div>
          {noEmail.length ? (
            <p className="text-xs text-warning">
              {noEmail.length === 1 && single
                ? `${firstName(single.name)} has no email. Call or Viber them too.`
                : `${noEmail.length} have no email. Call or Viber them too.`}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button autoFocus onClick={onSend}>
            {single ? 'Shortlist and send' : `Shortlist ${recipients.length} and send`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
