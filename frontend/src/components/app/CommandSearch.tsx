'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { useGetMyCompanyCandidatesQuery } from '@/store/services/applicationsApi'
import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'

import { JobsIcon, SearchIcon, UserIcon } from '@/components/icons'
import { IconButton } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { RECRUITER_NAV } from './navigation'

/** Search icon in the top bar, also ⌘K / Ctrl+K: jump to a job, a candidate or a page. */
export function CommandSearch({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const jobs = useGetCompanyJobsQuery(undefined, { skip: !open }).data?.data ?? []
  const people =
    useGetMyCompanyCandidatesQuery({ page: 1, size: 200 }, { skip: !open }).data?.data ?? []

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <IconButton label="Search" onClick={() => setOpen(true)}>
        <SearchIcon className="size-5" />
      </IconButton>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Find a job or a candidate"
      >
        <CommandInput placeholder="Search jobs and candidates" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          {jobs.length ? (
            <CommandGroup heading="Jobs">
              {jobs.map((job) => (
                <CommandItem
                  key={job.id}
                  value={`${job.title} ${job.id}`}
                  onSelect={() => go(`/recruiter/jobs/${job.id}`)}
                >
                  <JobsIcon />
                  {job.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {people.length ? (
            <CommandGroup heading="Candidates">
              {people.map((person) => (
                <CommandItem
                  key={person.candidate_id}
                  value={`${person.applicant_name} ${person.primary_job_title} ${person.candidate_id}`}
                  onSelect={() =>
                    go(
                      `/recruiter/jobs/${person.primary_job_id}?candidate=${person.latest_application_id}`,
                    )
                  }
                >
                  <UserIcon />
                  <span className="truncate">{person.applicant_name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {person.primary_job_title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Pages">
            {RECRUITER_NAV.filter((item) => isAdmin || !item.adminOnly).map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
