'use client'

import { ACTION_LABEL, type DecisionAction, type Stage, actionsFor } from '@/lib/api/recruiter'
import { cn } from '@/lib/utils'

import { StatusPill } from '@/components/app/StatusPill'
import { MoreIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Kbd } from './parts'

const KEYS: Partial<Record<DecisionAction, string>> = { shortlist: 'S', reject: 'N' }

/** The decision buttons for a stage, plus a small "More" menu. */
export function DecisionButtons({
  stage,
  name,
  onDecide,
  size = 'md',
  className,
}: {
  stage: Stage
  name: string
  onDecide: (action: DecisionAction) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const { primary, more } = actionsFor(stage)
  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      {stage === 'offer' && !primary.length ? (
        <span className="text-sm text-muted-foreground">Waiting for their answer</span>
      ) : null}
      {stage === 'hired' ? <StatusPill tone="success">Hired</StatusPill> : null}
      {stage === 'rejected' ? <StatusPill tone="neutral">Not now</StatusPill> : null}
      {stage === 'withdrawn' ? <StatusPill tone="neutral">Withdrawn</StatusPill> : null}
      {primary.map((action, index) => (
        <Button
          key={action}
          size={size}
          variant={index === primary.length - 1 ? 'primary' : 'outline'}
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
            <IconButton label={`More for ${name}`} variant="outline" size={size === 'sm' ? 'sm' : 'md'}>
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
