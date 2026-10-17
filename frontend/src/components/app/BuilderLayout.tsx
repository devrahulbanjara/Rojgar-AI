'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { formatDistanceToNowStrict } from 'date-fns'

import { CheckIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export type BuilderStep = { id: string; label: string; complete: boolean }

/** Multi-step builder: left outline with progress, step body, autosave, footer actions. */
export function BuilderLayout({
  title,
  steps,
  current,
  onStepChange,
  savedAt,
  saving = false,
  onPrevious,
  onNext,
  nextLabel = 'Save & continue',
  nextLoading = false,
  children,
}: {
  /** e.g. "Job setup" → "Job setup 60%". */
  title: string
  steps: BuilderStep[]
  current: number
  onStepChange?: (index: number) => void
  savedAt?: Date | null
  saving?: boolean
  onPrevious?: () => void
  onNext: () => void
  nextLabel?: string
  nextLoading?: boolean
  children: ReactNode
}) {
  const done = steps.filter((step) => step.complete).length
  const pct = Math.round((done / steps.length) * 100)

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {title} {pct}%
          </p>
          <Progress value={pct} className="h-1" />
        </div>
        <ol className="flex gap-1 overflow-x-auto lg:flex-col">
          {steps.map((step, index) => (
            <li key={step.id}>
              <Button
                variant="ghost"
                onClick={() => onStepChange?.(index)}
                disabled={!onStepChange}
                aria-current={index === current ? 'step' : undefined}
                className={cn(
                  'w-full justify-start font-normal',
                  index === current
                    ? 'bg-primary/8 font-medium text-primary hover:bg-primary/12'
                    : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                    step.complete && 'border-success bg-success text-white',
                  )}
                >
                  {step.complete ? <CheckIcon weight="bold" className="size-3" /> : index + 1}
                </span>
                {step.label}
              </Button>
            </li>
          ))}
        </ol>
      </aside>

      <section className="flex min-w-0 flex-col gap-6 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Step {current + 1} of {steps.length}
          </p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {saving
              ? 'Saving…'
              : savedAt
                ? `Saved · ${formatDistanceToNowStrict(savedAt)} ago`
                : null}
          </p>
        </div>
        {children}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <Button variant="outline" onClick={onPrevious} disabled={!onPrevious || current === 0}>
            Previous
          </Button>
          <Button onClick={onNext} loading={nextLoading}>
            {nextLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}
