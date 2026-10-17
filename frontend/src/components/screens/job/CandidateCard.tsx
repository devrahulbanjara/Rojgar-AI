'use client'

import Link from 'next/link'

import {
  ACTION_LABEL,
  type DecideAction,
  type PipelineItem,
  SOURCE_LABEL,
  contactLinks,
} from '@/lib/api/recruiter'
import { ago } from '@/lib/dates'
import { cn } from '@/lib/utils'

import { AiText } from '@/components/app/Ai'
import { EntityAvatar } from '@/components/app/EntityAvatar'
import { FitPill } from '@/components/app/StatusPill'
import { PhoneIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import { cardActions } from './DecisionButtons'
import { FlagLine } from './parts'

function Review({ item }: { item: PipelineItem }) {
  if (item.flagged) return <FlagLine />
  if (item.review_state === 'pending') return <AiText className="text-xs">Reading CV…</AiText>
  if (item.summary)
    return <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
  return null
}

/**
 * One candidate. Phones get a card with one-tap Call / Viber / decision buttons;
 * wide screens get a compact row that opens the panel beside the list.
 */
export function CandidateCard({
  item,
  href,
  active,
  selected,
  onSelectChange,
  onDecide,
  onOpen,
}: {
  item: PipelineItem
  href: string
  active: boolean
  selected: boolean
  onSelectChange: (selected: boolean) => void
  onDecide: (action: DecideAction) => void
  onOpen: () => void
}) {
  const primary = cardActions(item.stage)
  const phone = item.phone
  return (
    <li
      data-app={item.application_id}
      data-active={active || undefined}
      className={cn(
        'group relative rounded-2xl border bg-card transition-colors lg:rounded-xl lg:border-transparent lg:bg-transparent',
        active ? 'lg:border-primary/30 lg:bg-primary/5' : 'lg:hover:bg-card',
      )}
    >
      <div className="flex items-start gap-3 p-4 lg:px-3 lg:py-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectChange(!!value)}
          aria-label={`Select ${item.name}`}
          className="relative z-10 mt-1 hidden lg:flex"
        />
        <EntityAvatar name={item.name} src={item.avatar_url} className="size-11 lg:hidden" />
        <Link
          href={href}
          scroll={false}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
            event.preventDefault()
            onOpen()
          }}
          aria-current={active ? 'true' : undefined}
          className="flex min-w-0 flex-1 flex-col gap-1 outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring lg:after:rounded-xl"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-foreground">{item.name}</span>
            {item.fit && !item.flagged ? <FitPill fit={item.fit} /> : null}
          </span>
          {item.referred_by ? (
            <span className="text-xs font-medium text-primary">
              Recommended by {item.referred_by.name}
            </span>
          ) : null}
          <Review item={item} />
          <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            {SOURCE_LABEL[item.source]} · {ago(item.applied_at)}
          </span>
        </Link>
      </div>
      {phone || primary.length ? (
        <div className="relative z-10 flex flex-col gap-2 border-t px-4 py-3 lg:hidden">
          {phone ? (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="lg">
                <a href={contactLinks.call(phone)}>
                  <PhoneIcon />
                  Call
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={contactLinks.viber(phone)}>Viber</a>
              </Button>
            </div>
          ) : null}
          {primary.length ? (
            <div className="grid auto-cols-fr grid-flow-col gap-2">
              {primary.map((action, index) => (
                <Button
                  key={action}
                  size="lg"
                  variant={index === primary.length - 1 ? 'primary' : 'outline'}
                  onClick={() => onDecide(action)}
                >
                  {ACTION_LABEL[action]}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
