'use client'

import { useState } from 'react'

import { protectedGroundWarning } from '@/lib/api/recruiter'
import { cn } from '@/lib/utils'

import { PlusIcon, WarningIcon, XIcon } from '@/components/icons'
import { Button, IconButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX = 6

/** 3–6 short criteria as editable chips; protected-ground warnings inline. */
export function MustHaveChips({
  value,
  onChange,
  label,
}: {
  value: string[]
  onChange: (value: string[]) => void
  label: string
}) {
  const [draft, setDraft] = useState('')
  const warnings = value
    .map((item) => ({ item, warning: protectedGroundWarning(item) }))
    .filter((w) => w.warning)

  function add() {
    const text = draft.trim()
    if (!text || value.length >= MAX || value.includes(text)) return
    onChange([...value, text])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-2" aria-label={label}>
        {value.map((item, index) => {
          const flagged = !!protectedGroundWarning(item)
          return (
            <li
              key={index}
              className={cn(
                'flex max-w-full items-center rounded-full border bg-card pr-1 pl-3 focus-within:ring-2 focus-within:ring-ring/40',
                flagged && 'border-warning bg-warning-bg',
              )}
            >
              <Input
                value={item}
                onChange={(event) =>
                  onChange(value.map((v, i) => (i === index ? event.target.value : v)))
                }
                onBlur={() => onChange(value.map((v) => v.trim()).filter(Boolean))}
                aria-label={`Must-have ${index + 1}`}
                className="h-8 min-w-24 border-0 bg-transparent px-0 shadow-none [field-sizing:content] focus-visible:ring-0"
              />
              <IconButton
                label={`Remove ${item}`}
                size="sm"
                className="size-7"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <XIcon />
              </IconButton>
            </li>
          )
        })}
        {value.length < MAX ? (
          <li className="flex items-center gap-1">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  add()
                }
              }}
              placeholder={value.length ? 'Add another' : 'e.g. Can work night shifts'}
              aria-label="Add a must-have"
              className="h-8 w-48 rounded-full bg-card"
            />
            <IconButton label="Add must-have" size="sm" variant="outline" onClick={add}>
              <PlusIcon />
            </IconButton>
          </li>
        ) : null}
      </ul>
      {warnings.map(({ item, warning }) => (
        <p key={item} className="flex items-start gap-1.5 text-xs text-warning">
          <WarningIcon weight="fill" className="mt-px size-3.5 shrink-0" />
          <span>
            “{item}”: {warning}.
          </span>
        </p>
      ))}
    </div>
  )
}

export function SuggestButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick} disabled={disabled}>
      Suggest from description
    </Button>
  )
}
