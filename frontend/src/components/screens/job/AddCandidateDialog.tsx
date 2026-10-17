'use client'

import { useState } from 'react'

import { useQuickAddMutation } from '@/lib/api/recruiter'
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

type Source = 'walk_in' | 'phone' | 'referral'

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
  const [quickAdd, { isLoading: busy }] = useQuickAddMutation()
  const ready = name.trim() && phone.trim()

  async function submit() {
    if (!ready) return
    try {
      await quickAdd({
        jobId,
        full_name: name.trim(),
        phone: phone.trim(),
        cv,
        source,
        referred_by: source === 'referral' ? referredBy.trim() || null : null,
      }).unwrap()
      notify.success(`Added ${name.trim()}`)
      setName('')
      setPhone('')
      setCv(null)
      setReferredBy('')
      onOpenChange(false)
    } catch (error) {
      const status = (error as { status?: number }).status
      notify.error(
        status === 409
          ? 'They have already applied to this job.'
          : status === 422
            ? 'Check the name and phone number.'
            : "Couldn't add them. Try again.",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add applicant</DialogTitle>
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
        <DialogFooter>
          <Button type="submit" form="add-candidate" loading={busy} disabled={!ready}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
