'use client'

import {
  ACTION_LABEL,
  CAN_REJECT,
  type DecideAction,
  FORWARD,
  type Stage,
} from '@/lib/api/recruiter'
import { cn } from '@/lib/utils'

import { StagePill } from '@/components/app/StatusPill'
import { MoreIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Kbd } from './parts'

const KEYS: Partial<Record<DecideAction, string>> = { shortlist: 'S', reject: 'R' }

/** Actions a list card can offer without loading the panel (mirrors the backend rules). */
export function cardActions(stage: Stage): DecideAction[] {
  const forward = FORWARD[stage]
  return [...(CAN_REJECT(stage) ? (['reject'] as const) : []), ...(forward ? [forward] : [])]
}

/** Reject + the next step as buttons; everything else (move back, withdraw…) in "More". */
export function splitActions(stage: Stage, actions: DecideAction[]) {
  const forward = FORWARD[stage]
  const primary = (['reject', forward] as const).filter(
    (a): a is DecideAction => !!a && actions.includes(a),
  )
  return { primary, more: actions.filter((a) => !primary.includes(a)) }
}

export function DecisionButtons({
  stage,
  actions,
  name,
  onDecide,
  className,
}: {
  stage: Stage
  /** From the panel: the actions valid now, in button order. */
  actions: DecideAction[]
  name: string
  onDecide: (action: DecideAction) => void
  className?: string
}) {
  const { primary, more } = splitActions(stage, actions)
  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      {stage === 'hired' || stage === 'rejected' || stage === 'withdrawn' ? (
        <StagePill stage={stage} />
      ) : null}
      {primary.map((action) => (
        <Button
          key={action}
          variant={action === 'reject' ? 'outline' : 'primary'}
          onClick={() => onDecide(action)}
          className="flex-1 sm:flex-none"
        >
          {ACTION_LABEL[action]}
          {KEYS[action] ? <Kbd>{KEYS[action]}</Kbd> : null}
        </Button>
      ))}
      {more.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={`More for ${name}`} variant="outline">
              <MoreIcon weight="bold" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {more.map((action) => (
              <DropdownMenuItem key={action} onSelect={() => onDecide(action)}>
                {ACTION_LABEL[action]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
