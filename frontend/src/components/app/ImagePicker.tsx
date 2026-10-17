'use client'

import { useRef } from 'react'

import { validateImageFile } from '@/lib/mediaValidation'
import { notify } from '@/lib/notify'

import { Button } from '@/components/ui/button'

import { EntityAvatar } from './EntityAvatar'

/** Photo or logo with Change / Remove. Validates type and size before handing the file over. */
export function ImagePicker({
  name,
  src,
  kind = 'person',
  onPick,
  onRemove,
  busy = false,
}: {
  name: string
  src?: string | null
  kind?: 'person' | 'company'
  onPick: (file: File) => void | Promise<void>
  onRemove?: () => void | Promise<void>
  busy?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const noun = kind === 'company' ? 'logo' : 'photo'

  return (
    <div className="flex items-center gap-4">
      <EntityAvatar name={name || '?'} src={src} kind={kind} className="size-16 text-base" />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={busy}
          onClick={() => input.current?.click()}
        >
          {src ? `Change ${noun}` : `Add ${noun}`}
        </Button>
        {src && onRemove ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void onRemove()}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          const problem = validateImageFile(file)
          if (problem) notify.error(problem)
          else void onPick(file)
        }}
      />
    </div>
  )
}
