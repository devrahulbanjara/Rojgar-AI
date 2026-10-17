'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { useGetCompanyJobsQuery } from '@/store/services/jobsApi'

import { JobsIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { RECRUITER_NAV } from './navigation'

/** Global search (⌘K / Ctrl+K): jump to any page or job. */
export function CommandSearch({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { data } = useGetCompanyJobsQuery(undefined, { skip: !open })
  const jobs = data?.data ?? []

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
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full min-w-0 max-w-sm shrink justify-start bg-background font-normal text-muted-foreground"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="hidden rounded border bg-card px-1.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a page or job"
      >
        <CommandInput placeholder="Search pages and jobs" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            {RECRUITER_NAV.filter((item) => isAdmin || !item.adminOnly).map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
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
        </CommandList>
      </CommandDialog>
    </>
  )
}
