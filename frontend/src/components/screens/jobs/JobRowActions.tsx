'use client'

import { useState } from 'react'

import Link from 'next/link'

import { notify } from '@/lib/notify'
import { useDeleteJobAIDraftMutation } from '@/store/services/jobAiApi'
import { useDeleteJobMutation, useUpdateJobMutation } from '@/store/services/jobsApi'
import { addDays, format } from 'date-fns'

import { ConfirmDialog } from '@/components/app/Feedback'
import { EditIcon, MoreIcon, TrashIcon } from '@/components/icons'
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

import type { JobRow } from './JobsView'

function ReopenDialog({
  row,
  open,
  onOpenChange,
}: {
  row: JobRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [updateJob, { isLoading }] = useUpdateJobMutation()
  const [closesOn, setClosesOn] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [error, setError] = useState<string | null>(null)

  async function reopen() {
    const date = new Date(`${closesOn}T23:59:00`)
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setError('Pick a date in the future.')
      return
    }
    try {
      await updateJob({ id: row.id, status: 'active', expires_at: date.toISOString() }).unwrap()
      notify.success(`${row.title} is open again`)
      onOpenChange(false)
    } catch {
      setError("Couldn't reopen the job. Try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reopen {row.title}</DialogTitle>
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
          <Button loading={isLoading} onClick={() => void reopen()}>
            Reopen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Per-row "…" menu: edit, close / reopen, delete. */
export function JobRowActions({ row }: { row: JobRow }) {
  const [updateJob] = useUpdateJobMutation()
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation()
  const [deleteDraft, { isLoading: deletingDraft }] = useDeleteJobAIDraftMutation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)

  async function closeJob() {
    try {
      await updateJob({ id: row.id, status: 'expired' }).unwrap()
      notify.success(`${row.title} is closed`, {
        action: {
          label: 'Undo',
          onClick: () => void updateJob({ id: row.id, status: 'active' }),
        },
      })
    } catch {
      notify.error("Couldn't close the job. Try again.")
    }
  }

  async function remove() {
    try {
      if (row.kind === 'ai_draft') await deleteDraft(row.id).unwrap()
      else await deleteJob(row.id).unwrap()
      notify.success(`Deleted ${row.title}`)
      setConfirmOpen(false)
    } catch {
      notify.error("Couldn't delete it. Try again.")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label={`Actions for ${row.title}`} size="sm">
            <MoreIcon weight="bold" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {row.kind === 'job' ? (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/recruiter/jobs/${row.id}/edit`}>
                  <EditIcon />
                  Edit
                </Link>
              </DropdownMenuItem>
              {row.status === 'active' ? (
                <DropdownMenuItem onSelect={() => void closeJob()}>Close job</DropdownMenuItem>
              ) : null}
              {row.status === 'expired' && !row.hiringCompleted ? (
                <DropdownMenuItem onSelect={() => setReopenOpen(true)}>Reopen</DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${row.title}?`}
        consequence={
          row.kind === 'job' && row.applicants > 0
            ? `Its ${row.applicants} application${row.applicants === 1 ? '' : 's'} will be deleted too. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        busy={deleting || deletingDraft}
        onConfirm={remove}
      />
      {row.kind === 'job' ? (
        <ReopenDialog row={row} open={reopenOpen} onOpenChange={setReopenOpen} />
      ) : null}
    </>
  )
}
