'use client'

import { useState } from 'react'

import { notify } from '@/lib/notify'
import {
  type JobListItem,
  useDeleteJobMutation,
  useUpdateJobMutation,
} from '@/store/services/jobsApi'
import { addDays, format } from 'date-fns'

import { ConfirmDialog } from '@/components/app/Feedback'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type JobDialog = 'filled' | 'close' | 'delete' | 'reopen'

type LifecycleJob = Pick<JobListItem, 'id' | 'title' | 'status' | 'closed_reason' | 'closes_at'> & {
  applicants: number
}

/** Which lifecycle actions a job offers right now, in menu order. */
export function jobDialogs(job: Pick<JobListItem, 'status'>): JobDialog[] {
  if (job.status === 'open') return ['filled', 'close', 'delete']
  if (job.status === 'closed') return ['reopen', 'delete']
  return ['delete']
}

export const JOB_DIALOG_LABEL: Record<JobDialog, string> = {
  filled: 'Close as filled',
  close: 'Close job',
  reopen: 'Reopen',
  delete: 'Delete',
}

function waitingLine(waiting: number | null) {
  if (waiting === 0) return ''
  if (waiting === null) return 'Everyone still waiting gets a kind email. '
  return `${waiting} ${waiting === 1 ? 'person' : 'people'} still waiting get a kind email. `
}

function ReopenDialog({
  job,
  open,
  onOpenChange,
}: {
  job: LifecycleJob
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [updateJob, { isLoading }] = useUpdateJobMutation()
  const [closesOn, setClosesOn] = useState(() =>
    format(
      job.closes_at && new Date(job.closes_at) > new Date()
        ? new Date(job.closes_at)
        : addDays(new Date(), 30),
      'yyyy-MM-dd',
    ),
  )
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const date = new Date(`${closesOn}T23:59:00`)
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setError('Pick a date in the future.')
      return
    }
    try {
      await updateJob({ id: job.id, status: 'open', closes_at: date.toISOString() }).unwrap()
      notify.success(`${job.title} is open again`)
      onOpenChange(false)
    } catch {
      setError("Couldn't reopen the job. Try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reopen {job.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reopen-closes">Closes on</Label>
          <Input
            id="reopen-closes"
            type="date"
            value={closesOn}
            onChange={(event) => {
              setClosesOn(event.target.value)
              setError(null)
            }}
            aria-invalid={!!error}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isLoading} onClick={() => void submit()}>
            Reopen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Close as filled / close / reopen / delete. Closing tells everyone still waiting. */
export function JobLifecycleDialogs({
  job,
  waiting = null,
  dialog,
  onDialogChange,
  onDeleted,
}: {
  job: LifecycleJob
  /** People in New, Shortlisted or Interview; null when not known. */
  waiting?: number | null
  dialog: JobDialog | null
  onDialogChange: (dialog: JobDialog | null) => void
  onDeleted?: () => void
}) {
  const [updateJob, { isLoading: closing }] = useUpdateJobMutation()
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation()
  const toggle = (name: JobDialog) => (open: boolean) => onDialogChange(open ? name : null)

  async function close(reason: 'hired' | 'cancelled') {
    try {
      await updateJob({ id: job.id, status: 'closed', closed_reason: reason }).unwrap()
      notify.success(
        reason === 'hired' ? `${job.title} is filled and closed` : `${job.title} is closed`,
      )
      onDialogChange(null)
    } catch {
      notify.error("Couldn't close the job. Try again.")
    }
  }

  async function remove() {
    try {
      await deleteJob(job.id).unwrap()
      notify.success(`Deleted ${job.title}`)
      onDialogChange(null)
      onDeleted?.()
    } catch {
      notify.error("Couldn't delete it. Try again.")
    }
  }

  return (
    <>
      <ConfirmDialog
        open={dialog === 'filled'}
        onOpenChange={toggle('filled')}
        title={`Close ${job.title} as filled?`}
        consequence={`The job closes. ${waitingLine(waiting)}This can't be undone.`}
        confirmLabel="Close as filled"
        busy={closing}
        onConfirm={() => close('hired')}
      />
      <ConfirmDialog
        open={dialog === 'close'}
        onOpenChange={toggle('close')}
        title={`Close ${job.title}?`}
        consequence={`No one new can apply. ${waitingLine(waiting)}This can't be undone.`}
        confirmLabel="Close job"
        busy={closing}
        onConfirm={() => close('cancelled')}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={toggle('delete')}
        title={`Delete ${job.title}?`}
        consequence={
          job.applicants
            ? `Its ${job.applicants} application${job.applicants === 1 ? '' : 's'} will be deleted too. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={remove}
      />
      {dialog === 'reopen' ? <ReopenDialog job={job} open onOpenChange={toggle('reopen')} /> : null}
    </>
  )
}
