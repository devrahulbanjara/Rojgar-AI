'use client'

import { useState } from 'react'

import { parseApiError } from '@/lib/apiError'
import { notify } from '@/lib/notify'
import { ROLE_CAN, ROLE_LABEL } from '@/lib/session'
import type { BusinessRole } from '@/lib/types/user'
import { useCreateInviteMutation } from '@/store/services/companyApi'

import { CopyIcon, PlusIcon, ViberIcon, WhatsAppIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const ROLES: BusinessRole[] = ['manager', 'interviewer', 'owner']

/** Invite: pick a role → one link to copy or send on WhatsApp / Viber. Each link works once. */
export function InviteDialog({
  businessId,
  businessName,
}: {
  businessId: string
  businessName: string
}) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<BusinessRole>('manager')
  const [url, setUrl] = useState<string | null>(null)
  const [createInvite, { isLoading }] = useCreateInviteMutation()

  const message = url ? `Join ${businessName} on Rojgar AI as ${ROLE_LABEL[role]}: ${url}` : ''

  function reset(next: boolean) {
    setOpen(next)
    if (!next) {
      setUrl(null)
      setRole('manager')
    }
  }

  async function create() {
    try {
      const res = await createInvite({ businessId, role }).unwrap()
      setUrl(res.data.url)
    } catch (error) {
      notify.error(parseApiError(error, {}, "Couldn't create the link. Try again.").message)
    }
  }

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      notify.success('Link copied')
    } catch {
      notify.error("Couldn't copy. Select the link and copy it instead.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {url
              ? `Send this link to your ${ROLE_LABEL[role].toLowerCase()}`
              : 'Invite to the team'}
          </DialogTitle>
        </DialogHeader>
        {url ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                aria-label="Invite link"
                className="h-10"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button variant="outline" onClick={() => void copy()}>
                <CopyIcon />
                Copy
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`viber://forward?text=${encodeURIComponent(message)}`}>
                  <ViberIcon />
                  Viber
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Works once, for 7 days.</p>
          </div>
        ) : (
          <RadioGroup
            value={role}
            onValueChange={(value) => setRole(value as BusinessRole)}
            className="gap-2"
          >
            {ROLES.map((option) => (
              <Label
                key={option}
                htmlFor={`role-${option}`}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-tint"
              >
                <RadioGroupItem id={`role-${option}`} value={option} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{ROLE_LABEL[option]}</span>
                  <span className="text-sm text-muted-foreground">{ROLE_CAN[option]}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
        <DialogFooter>
          {url ? (
            <Button variant="outline" onClick={() => reset(false)}>
              Done
            </Button>
          ) : (
            <Button loading={isLoading} onClick={() => void create()}>
              Create link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
