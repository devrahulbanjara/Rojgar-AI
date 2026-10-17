import type { ReactNode } from 'react'

import { FIT_LABEL, type Fit, contactLinks } from '@/lib/api/recruiter'
import { cn } from '@/lib/utils'

import { Hint } from '@/components/app/Hint'
import { StatusPill, type Tone } from '@/components/app/StatusPill'
import {
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  ViberIcon,
  WarningIcon,
  WhatsAppIcon,
} from '@/components/icons'
import { IconButton } from '@/components/ui/button'

const FIT_TONE: Record<Fit, Tone> = { strong: 'success', possible: 'warning', weak: 'neutral' }

/** "Fits" · "Might fit" · "Doesn't fit yet". */
export function FitPill({ fit, className }: { fit: Fit; className?: string }) {
  return (
    <StatusPill tone={FIT_TONE[fit]} className={className}>
      {FIT_LABEL[fit]}
    </StatusPill>
  )
}

/** One amber line: the CV needs a person before anyone trusts the review. */
export function FlagLine({ reason, className }: { reason: string; className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-xs text-warning', className)}>
      <WarningIcon weight="fill" className="mt-px size-3.5 shrink-0" />
      <span>Flagged: {reason.replace(/\.$/, '')}. Check the CV before deciding.</span>
    </p>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-1 hidden rounded border border-current/25 px-1 font-sans text-[10px] leading-4 opacity-70 lg:inline">
      {children}
    </kbd>
  )
}

type Contact = { key: string; label: string; href: string; icon: ReactNode; external?: boolean }

/**
 * Call · Viber · WhatsApp · Email · LinkedIn as round icon buttons. Each has a
 * tooltip and an aria-label; buttons whose data is missing are not shown.
 */
export function ContactButtons({
  phone,
  email,
  linkedin,
  only,
  className,
}: {
  phone?: string | null
  email?: string | null
  linkedin?: string | null
  /** Limit to some channels (phone cards show only the phone ones). */
  only?: string[]
  className?: string
}) {
  const contacts: Contact[] = []
  if (phone) {
    contacts.push(
      { key: 'call', label: `Call ${phone}`, href: contactLinks.call(phone), icon: <PhoneIcon /> },
      {
        key: 'viber',
        label: 'Message on Viber',
        href: contactLinks.viber(phone),
        icon: <ViberIcon className="size-5" />,
      },
      {
        key: 'whatsapp',
        label: 'Message on WhatsApp',
        href: contactLinks.whatsapp(phone),
        icon: <WhatsAppIcon className="size-[18px]" />,
        external: true,
      },
    )
  }
  if (email)
    contacts.push({
      key: 'email',
      label: `Email ${email}`,
      href: `mailto:${email}`,
      icon: <MailIcon />,
    })
  if (linkedin)
    contacts.push({
      key: 'linkedin',
      label: 'Open LinkedIn profile',
      href: linkedin,
      icon: <LinkedInIcon />,
      external: true,
    })
  const shown = only ? contacts.filter((c) => only.includes(c.key)) : contacts
  if (!shown.length) return null
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {shown.map((contact) => (
        <Hint key={contact.key} label={contact.label}>
          <IconButton
            asChild
            label={contact.label}
            title={undefined}
            variant="outline"
            className="size-11 sm:size-9 [&_svg:not([class*='size-'])]:size-[18px]"
          >
            <a
              href={contact.href}
              {...(contact.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {contact.icon}
            </a>
          </IconButton>
        </Hint>
      ))}
    </div>
  )
}

/** Backwards-compatible alias for ContactButtons. */
export const CallButtons = ContactButtons
