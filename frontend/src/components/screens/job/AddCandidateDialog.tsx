'use client'

import { useState } from 'react'

import { CAPABILITIES, type QuickAddInput, addCandidate } from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'

import { FileUpload } from '@/components/app/FileUpload'
import { FilterChips } from '@/components/app/FilterChips'
import { FormField } from '@/components/app/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type Source = QuickAddInput['source']

/** Walk-in, phone call or referral: add someone in a few taps. */
export function AddCandidateDialog({
  jobId,
  open,
  onOpenChange,
}: {
  jobId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cv, setCv] = useState<File | null>(null)
  const [source, setSource] = useState<Source>('walk_in')
  const [referredBy, setReferredBy] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = name.trim() && phone.trim()

  async function submit() {
    if (!ready) return
    setBusy(true)
    try {
      await addCandidate({
        jobId,
        name: name.trim(),
        phone: phone.trim(),
        cv,
        source,
        referred_by: source === 'referral' ? referredBy.trim() || null : null,
      })
      notify.success(`Added ${name.trim()}`)
      setName('')
      setPhone('')
      setCv(null)
      setReferredBy('')
      onOpenChange(false)
    } catch {
      notify.error("Couldn't add them. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add candidate</DialogTitle>
        </DialogHeader>
        <form
          id="add-candidate"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <FormField id="add-name" label="Name">
            <Input
              id="add-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              className="h-11"
            />
          </FormField>
          <FormField id="add-phone" label="Phone">
            <Input
              id="add-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              placeholder="98XXXXXXXX"
              className="h-11"
            />
          </FormField>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">How did they come?</span>
            <FilterChips<Source>
              label="How did they come?"
              value={source}
              onChange={setSource}
              options={[
                { value: 'walk_in', label: 'Walk-in' },
                { value: 'phone', label: 'Phone' },
                { value: 'referral', label: 'Referral' },
              ]}
            />
          </div>
          {source === 'referral' ? (
            <FormField id="add-ref" label="Recommended by">
              <Input
                id="add-ref"
                value={referredBy}
                onChange={(event) => setReferredBy(event.target.value)}
                className="h-11"
              />
            </FormField>
          ) : null}
          <FileUpload value={cv} onChange={setCv} label="CV (optional)" />
        </form>
        <DialogFooter className="items-center">
          {!CAPABILITIES.addCandidate ? (
            <span className="mr-auto text-xs text-muted-foreground">Coming soon</span>
          ) : null}
          <Button
            type="submit"
            form="add-candidate"
            loading={busy}
            disabled={!ready || !CAPABILITIES.addCandidate}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
