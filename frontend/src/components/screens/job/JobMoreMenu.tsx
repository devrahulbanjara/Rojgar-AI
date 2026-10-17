'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  type Job,
  exportPipelineCsv,
  useCloseJobMutation,
  useDeleteJobMutation,
  useReopenJobMutation,
} from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'
import { addDays, format } from 'date-fns'

import { ConfirmDialog } from '@/components/app/Feedback'
import { DownloadIcon, MoreIcon, TrashIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ReopenDialog({
  job,
  open,
  onOpenChange,
}: {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [reopen, { isLoading }] = useReopenJobMutation()
  const [closesOn, setClosesOn] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const date = new Date(`${closesOn}T23:59:00`)
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setError('Pick a date in the future.')
      return
    }
    try {
      await reopen({ id: job.id, closes_at: date.toISOString() }).unwrap()
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

/** Close / reopen / fill / export / delete: everything that isn't Share or Edit. */
export function JobMoreMenu({ job, waiting }: { job: Job; waiting: number }) {
  const router = useRouter()
  const [closeJob, { isLoading: closing }] = useCloseJobMutation()
  const [reopenJob] = useReopenJobMutation()
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation()
  const [dialog, setDialog] = useState<'filled' | 'delete' | 'reopen' | null>(null)

  async function close() {
    try {
      await closeJob({ id: job.id, reason: 'cancelled' }).unwrap()
      const closesAt = job.closes_at && new Date(job.closes_at) > new Date() ? job.closes_at : null
      notify.undoable(`${job.title} is closed`, {
        onUndo: () =>
          void reopenJob({
            id: job.id,
            closes_at: closesAt ?? addDays(new Date(), 30).toISOString(),
          }),
      })
    } catch {
      notify.error("Couldn't close the job. Try again.")
    }
  }

  async function markFilled() {
    try {
      await closeJob({ id: job.id, reason: 'hired' }).unwrap()
      notify.success(`${job.title} is filled and closed`)
      setDialog(null)
    } catch {
      notify.error("Couldn't close the job. Try again.")
    }
  }

  async function remove() {
    try {
      await deleteJob(job.id).unwrap()
      notify.success(`Deleted ${job.title}`)
      router.push('/recruiter/jobs')
    } catch {
      notify.error("Couldn't delete it. Try again.")
    }
  }

  async function exportCsv() {
    try {
      await exportPipelineCsv(job.id, job.title)
    } catch {
      notify.error("Couldn't export. Try again.")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label="More actions" variant="outline">
            <MoreIcon weight="bold" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {job.applicants ? (
            <DropdownMenuItem onSelect={() => void exportCsv()}>
              <DownloadIcon />
              Export to Excel (CSV)
            </DropdownMenuItem>
          ) : null}
          {job.status === 'open' ? (
            <>
              <DropdownMenuItem onSelect={() => setDialog('filled')}>
                Mark position filled
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void close()}>Close job</DropdownMenuItem>
            </>
          ) : null}
          {job.status === 'closed' && job.closed_reason !== 'hired' ? (
            <DropdownMenuItem onSelect={() => setDialog('reopen')}>Reopen</DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={dialog === 'filled'}
        onOpenChange={(open) => setDialog(open ? 'filled' : null)}
        title={`Mark ${job.title} as filled?`}
        consequence={
          waiting
            ? `The job closes and ${waiting} ${waiting === 1 ? 'person' : 'people'} still waiting get a kind "position filled" email. This can't be undone.`
            : "The job closes. This can't be undone."
        }
        confirmLabel="Mark filled"
        busy={closing}
        onConfirm={markFilled}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => setDialog(open ? 'delete' : null)}
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
      <ReopenDialog
        job={job}
        open={dialog === 'reopen'}
        onOpenChange={(open) => setDialog(open ? 'reopen' : null)}
      />
    </>
  )
}
