'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { exportPipelineCsv } from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'
import type { JobDetail } from '@/store/services/jobsApi'

import { DownloadIcon, MoreIcon, TrashIcon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { JOB_DIALOG_LABEL, type JobDialog, JobLifecycleDialogs, jobDialogs } from './JobLifecycle'

/** Close / reopen / export / delete: everything that isn't Share or Edit. */
export function JobMoreMenu({ job, waiting }: { job: JobDetail; waiting: number }) {
  const router = useRouter()
  const [dialog, setDialog] = useState<JobDialog | null>(null)
  const dialogs = jobDialogs(job)

  async function exportCsv() {
    try {
      await exportPipelineCsv(job.id)
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
          {job.applications_count ? (
            <DropdownMenuItem onSelect={() => void exportCsv()}>
              <DownloadIcon />
              Export to Excel (CSV)
            </DropdownMenuItem>
          ) : null}
          {dialogs
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

      <JobLifecycleDialogs
        job={{ ...job, applicants: job.applications_count }}
        waiting={waiting}
        dialog={dialog}
        onDialogChange={setDialog}
        onDeleted={() => router.push('/recruiter/jobs')}
      />
    </>
  )
}
