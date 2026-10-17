'use client'

import { type ReactNode, useState } from 'react'

import {
  type ReferrerResponse,
  contactLinks,
  phoneDigits,
  posterUrl,
  referralMessage,
  useCreateReferrerMutation,
  useListReferrersQuery,
} from '@/lib/api/recruiter'
import { notify } from '@/lib/notify'
import type { JobDetail } from '@/store/services/jobsApi'

import { SharePanel, copyText } from '@/components/app/ShareMenu'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LinkIcon,
  QrIcon,
  UserIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type View = 'menu' | 'ask' | 'post'

function Option({
  icon,
  title,
  detail,
  onClick,
  href,
}: {
  icon: ReactNode
  title: string
  detail: string
  onClick?: () => void
  href?: string
}) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="text-base font-medium text-foreground">{title}</span>
        <span className="text-sm font-normal whitespace-normal text-muted-foreground">
          {detail}
        </span>
      </span>
      <ChevronRightIcon className="text-muted-foreground" />
    </>
  )
  const className = 'h-auto w-full justify-start gap-4 rounded-2xl px-4 py-4'
  if (href) {
    return (
      <Button asChild variant="outline" className={className}>
        <a href={href} target="_blank" rel="noreferrer">
          {body}
        </a>
      </Button>
    )
  }
  return (
    <Button variant="outline" className={className} onClick={onClick}>
      {body}
    </Button>
  )
}

function AskPeople({ job }: { job: JobDetail }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [createReferrer, { isLoading: busy }] = useCreateReferrerMutation()
  const asked = useListReferrersQuery(job.id).data ?? []
  const [current, setCurrent] = useState<ReferrerResponse | null>(null)

  async function makeLink() {
    if (!name.trim()) return
    try {
      const referrer = await createReferrer({
        jobId: job.id,
        name: name.trim(),
        phone: phone.trim() || null,
      }).unwrap()
      setCurrent(referrer)
      setName('')
      setPhone('')
    } catch {
      notify.error("Couldn't make the link. Try again.")
    }
  }

  const message = current
    ? referralMessage({ title: job.title, company_name: job.company.name }, current, current.link)
    : ''
  const others = asked.filter((r) => r.id !== current?.id)

  return (
    <div className="flex flex-col gap-5">
      {current ? (
        <div className="flex flex-col gap-3 rounded-2xl border bg-muted/40 p-4">
          <p className="text-sm font-medium">Message for {current.name}</p>
          <p className="max-h-48 overflow-y-auto text-sm whitespace-pre-line text-muted-foreground">
            {message}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="lg">
              <a href={contactLinks.viberText(message)}>Viber</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={
                  current.phone
                    ? `https://wa.me/${phoneDigits(current.phone)}?text=${encodeURIComponent(message)}`
                    : contactLinks.whatsappText(message)
                }
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={
                  current.phone
                    ? `sms:${current.phone}?&body=${encodeURIComponent(message)}`
                    : contactLinks.smsText(message)
                }
              >
                SMS
              </a>
            </Button>
            <Button size="lg" variant="outline" onClick={() => void copyText(message, 'Message')}>
              <CopyIcon />
              Copy
            </Button>
          </div>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void makeLink()
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ref-name">{current ? 'Ask someone else' : 'Who are you asking?'}</Label>
          <Input
            id="ref-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ram Thapa"
            autoComplete="off"
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ref-phone">Their phone (optional)</Label>
          <Input
            id="ref-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="98XXXXXXXX"
            inputMode="tel"
            className="h-11"
          />
        </div>
        <Button type="submit" size="lg" loading={busy} disabled={!name.trim()}>
          Make their link
        </Button>
      </form>

      {others.length ? (
        <ul className="flex flex-col gap-2 text-sm">
          {others.map((referrer) => (
            <li key={referrer.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                {referrer.name}
                <span className="text-muted-foreground"> · {referrer.applications} applied</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void copyText(referrer.link, `${referrer.name}'s link`)}
              >
                <LinkIcon />
                Copy link
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** "Get applicants": ask people you know, print a poster, or post online. */
export function GetApplicantsSheet({
  job,
  open,
  onOpenChange,
}: {
  job: JobDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [view, setView] = useState<View>('menu')
  const slug = job.slug

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setView('menu')
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="px-5 pt-5">
          {view !== 'menu' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('menu')}
              className="-ml-3 self-start"
            >
              <ArrowLeftIcon />
              Back
            </Button>
          ) : null}
          <SheetTitle className="font-heading text-xl font-normal">
            {view === 'ask'
              ? 'Ask people you know'
              : view === 'post'
                ? 'Post online'
                : 'Get applicants'}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-5">
          {!slug ? (
            <p className="text-sm text-muted-foreground">Publish the job to get its link.</p>
          ) : view === 'ask' ? (
            <AskPeople job={job} />
          ) : view === 'post' ? (
            <SharePanel
              job={{
                slug,
                title: job.title,
                companyName: job.company.name,
                location: job.location,
                locationType: job.location_type,
              }}
            />
          ) : (
            <>
              <Option
                icon={<UserIcon />}
                title="Ask people you know"
                detail="Send a personal link on Viber, WhatsApp or SMS"
                onClick={() => setView('ask')}
              />
              <Option
                icon={<QrIcon />}
                title="Print a poster"
                detail="For your shop, office or notice board"
                href={posterUrl(slug)}
              />
              <Option
                icon={<LinkIcon />}
                title="Post online"
                detail="Link and ready text for LinkedIn, Facebook and Merojob"
                onClick={() => setView('post')}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
