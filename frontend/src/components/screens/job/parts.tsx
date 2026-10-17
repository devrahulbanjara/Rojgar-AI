import type { ReactNode } from 'react'

import { contactLinks } from '@/lib/api/recruiter'
import { cn } from '@/lib/utils'

import { Hint } from '@/components/app/Hint'
import {
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  ViberIcon,
  WarningIcon,
  WebsiteIcon,
  WhatsAppIcon,
} from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'

/** One amber line: the CV needs a person before anyone trusts the review. */
export function FlagLine({ reason, className }: { reason?: string | null; className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-xs text-warning', className)}>
      <WarningIcon weight="fill" className="mt-px size-3.5 shrink-0" />
      <span>
        {reason ? `Flagged: ${reason.replace(/\.$/, '')}.` : 'Flagged.'} Check the CV before
        deciding.
      </span>
    </p>
  )
}

type Contact = {
  key: string
  text: string
  hint: string
  href: string
  icon: ReactNode
  external?: boolean
  truncate?: boolean
}

/**
 * Phone · Viber · WhatsApp · Email as small labelled pills that wrap as whole
 * items. Only the channels the applicant shared are shown.
 */
export function ContactButtons({
  phone,
  email,
  className,
}: {
  phone?: string | null
  email?: string | null
  className?: string
}) {
  const contacts: Contact[] = []
  if (phone) {
    contacts.push(
      {
        key: 'call',
        text: phone,
        hint: `Call ${phone}`,
        href: contactLinks.call(phone),
        icon: <PhoneIcon />,
      },
      {
        key: 'viber',
        text: 'Viber',
        hint: 'Message on Viber',
        href: contactLinks.viber(phone),
        icon: <ViberIcon />,
      },
      {
        key: 'whatsapp',
        text: 'WhatsApp',
        hint: 'Message on WhatsApp',
        href: contactLinks.whatsapp(phone),
        icon: <WhatsAppIcon />,
        external: true,
      },
    )
  }
  if (email)
    contacts.push({
      key: 'email',
      text: email,
      hint: `Email ${email}`,
      href: `mailto:${email}`,
      icon: <MailIcon />,
      truncate: true,
    })
  if (!contacts.length) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {contacts.map((contact) => (
        <Hint key={contact.key} label={contact.hint}>
          <Button asChild variant="outline" size="sm" className="min-w-0 rounded-full font-normal">
            <a
              href={contact.href}
              aria-label={contact.hint}
              {...(contact.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {contact.icon}
              <span className={cn(contact.truncate && 'max-w-48 truncate')}>{contact.text}</span>
            </a>
          </Button>
        </Hint>
      ))}
    </div>
  )
}

/** LinkedIn · GitHub · website as small icon buttons with a tooltip. */
export function ProfileLinks({
  linkedin,
  github,
  website,
}: {
  linkedin?: string | null
  github?: string | null
  website?: string | null
}) {
  const links = [
    { key: 'li', href: linkedin, label: 'LinkedIn profile', icon: <LinkedInIcon /> },
    { key: 'gh', href: github, label: 'GitHub profile', icon: <GitHubIcon /> },
    { key: 'web', href: website, label: 'Website', icon: <WebsiteIcon /> },
  ].filter((l): l is typeof l & { href: string } => !!l.href)
  return links.map((link) => (
    <Hint key={link.key} label={link.label}>
      <IconButton asChild label={link.label} size="sm" className="text-muted-foreground">
        <a href={link.href} target="_blank" rel="noreferrer">
          {link.icon}
        </a>
      </IconButton>
    </Hint>
  ))
}
