'use client'

import { type DragEvent, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { FilePdfIcon, UploadIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Drop zone for one file (a CV). Validates type and size before calling
 * onChange; shows name + size once chosen with a Replace action, and an
 * optional upload progress bar.
 */
export function FileUpload({
  value,
  onChange,
  accept = '.pdf,application/pdf',
  maxBytes = 10 * 1024 * 1024,
  label = 'Upload CV (PDF)',
  progress,
  error,
  disabled = false,
}: {
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
  maxBytes?: number
  label?: string
  /** 0–100 while uploading; omit when idle. */
  progress?: number
  error?: string
  disabled?: boolean
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const shownError = error ?? localError

  function accepts(file: File): boolean {
    const patterns = accept.split(',').map((p) => p.trim().toLowerCase())
    const name = file.name.toLowerCase()
    return patterns.some((p) => (p.startsWith('.') ? name.endsWith(p) : file.type === p))
  }

  function pick(file: File | undefined) {
    if (!file) return
    if (!accepts(file)) return setLocalError('That file type isn’t supported.')
    if (file.size > maxBytes) return setLocalError(`Files up to ${formatBytes(maxBytes)} only.`)
    setLocalError(null)
    onChange(file)
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    if (!disabled) pick(event.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          pick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
          <FilePdfIcon className="size-6 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(value.size)}</p>
            {progress !== undefined ? <Progress value={progress} className="mt-2 h-1" /> : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-4 py-8 text-center transition-colors hover:bg-accent',
            dragging && 'border-primary bg-primary/5',
            shownError && 'border-destructive',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <UploadIcon className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">Drop it here or tap to choose</span>
        </label>
      )}
      {shownError ? <p className="text-xs text-destructive">{shownError}</p> : null}
    </div>
  )
}
