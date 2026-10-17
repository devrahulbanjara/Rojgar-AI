'use client'

import { useState } from 'react'

import Link from 'next/link'

import { EditIcon, MoreIcon, TrashIcon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  JOB_DIALOG_LABEL,
  type JobDialog,
  JobLifecycleDialogs,
  jobDialogs,
} from '../job/JobLifecycle'
import type { JobRow } from './JobsView'

/** Per-row "…" menu: edit, close / reopen, delete. */
export function JobRowActions({ row }: { row: JobRow }) {
  const [dialog, setDialog] = useState<JobDialog | null>(null)

  return (
    <>
      {/* Not modal: a dialog opened from an item would otherwise leave the page unclickable. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <IconButton label={`Actions for ${row.title}`} size="sm">
            <MoreIcon weight="bold" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/recruiter/jobs/${row.id}/edit`}>
              <EditIcon />
              Edit
            </Link>
          </DropdownMenuItem>
          {jobDialogs(row)
            .filter((d) => d !== 'delete')
            .map((d) => (
              <DropdownMenuItem key={d} onSelect={() => setDialog(d)}>
                {JOB_DIALOG_LABEL[d]}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog('delete')}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <JobLifecycleDialogs job={row} dialog={dialog} onDialogChange={setDialog} />
    </>
  )
}
